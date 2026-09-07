import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAgentAPIHandler } from "../src/agent-api-handler.js";
import {
  AgentAnalysisContextRequiredError,
  AgentAnalysisNotFoundError,
  AgentAnalysisRunLimitError,
  AgentAnalysisStateError
} from "../src/agent-analysis-store.js";
import { AgentEvidenceUnavailableError } from "../src/agent-evidence-store.js";
import { ProviderError } from "../src/errors.js";

const REAL_JPEG = readFileSync(new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg",
  import.meta.url
));

const BASE = "/v1/agent/analyses";
const BOUNDARY = "----agentboundary";
const ID = "0123456789abcdef0123456789abcdef";
const UID = "uid-a";
const OWNER = createHash("sha256").update(UID).digest("hex");
const OTHER_OWNER = createHash("sha256").update("uid-b").digest("hex");

function multipart(parts) {
  const chunks = [];
  for (const part of parts) {
    chunks.push(Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${part.name}";`
      + ` filename="${part.filename}"\r\nContent-Type: ${part.type}\r\n\r\n`
    ));
    chunks.push(Buffer.isBuffer(part.body) ? part.body : Buffer.from(part.body));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

const upload = (body = REAL_JPEG, type = "image/jpeg") => ({
  method: "POST",
  url: BASE,
  headers: {
    authorization: "Bearer token-a",
    "content-type": `multipart/form-data; boundary=${BOUNDARY}`
  },
  rawBody: multipart([{ name: "file", filename: "shelf.jpg", type, body }])
});

const jsonRequest = (method, url, body, token = "token-a") => ({
  method,
  url,
  headers: {
    authorization: `Bearer ${token}`,
    ...(body === undefined ? {} : { "content-type": "application/json" })
  },
  ...(body === undefined ? {} : { rawBody: Buffer.from(JSON.stringify(body)) })
});

function responseDouble() {
  const sent = {};
  return {
    sent,
    writeHead(status, headers) { sent.status = status; sent.headers = headers; },
    end(body) { sent.body = body ? JSON.parse(body) : null; }
  };
}

const RECORD = Object.freeze({
  analysisId: ID, status: "analyzed", fileName: "shelf.jpg",
  mediaType: "image/jpeg", sha256: "a".repeat(64), byteLength: 1024,
  createdAt: { toDate: () => new Date("2026-09-07T12:00:00Z") },
  analyzedAt: null, failureReason: null, model: "gpt-test", mode: "areaScan",
  report: { summary: "one product", identifiedProducts: [], uncertainItems: [] },
  runCount: 1,
  runs: [{ runNumber: 1, context: null, status: "analyzed",
    startedAt: new Date("2026-09-07T12:00:01Z"), endedAt: null }]
});

function harness(overrides = {}) {
  const calls = [];
  const evidenceStore = {
    storeSource: async (input) => {
      calls.push(["storeSource", input]);
      return { path: "p", sha256: "a".repeat(64), byteLength: input.bytes.length };
    },
    ...overrides.evidenceStore
  };
  const analysisStore = {
    create: async (input) => { calls.push(["create", input]); return input; },
    read: async (input) => { calls.push(["read", input]); return RECORD; },
    list: async (input) => { calls.push(["list", input]); return [RECORD]; },
    ...overrides.analysisStore
  };
  const runner = {
    run: async (input) => { calls.push(["run", input]); return RECORD; },
    ...overrides.runner
  };
  const handle = createAgentAPIHandler({
    evidenceStore, analysisStore, runner,
    verifyIdToken: overrides.verifyIdToken
      ?? (async (token) => ({ uid: token === "token-b" ? "uid-b" : UID })),
    newAnalysisId: () => ID,
    logger: overrides.logger ?? { error: () => {}, warn: () => {}, info: () => {} }
  });
  return { handle, calls };
}

async function send(handle, request) {
  const response = responseDouble();
  await handle(request, response);
  return response.sent;
}

test("refuses a request that carries no verifiable bearer token", async () => {
  const { handle, calls } = harness();

  for (const headers of [{}, { authorization: "token-a" }, { authorization: "Bearer " }]) {
    const sent = await send(handle, { method: "GET", url: BASE, headers });
    assert.equal(sent.status, 401);
    assert.equal(sent.body.error.code, "unauthorized");
  }
  assert.equal(calls.length, 0, "nothing is read or written for an unauthenticated caller");
});

test("a rejected token is unauthorized, not a server error", async () => {
  const { handle } = harness({
    verifyIdToken: async () => { throw Object.assign(new Error("bad"), { code: "auth/id-token-expired" }); }
  });
  const sent = await send(handle, { method: "GET", url: BASE, headers: { authorization: "Bearer x" } });
  assert.equal(sent.status, 401);
  assert.equal(sent.body.error.code, "unauthorized");
});

test("stores the bytes before the record and answers 201 uploaded", async () => {
  const { handle, calls } = harness();

  const sent = await send(handle, upload());

  assert.equal(sent.status, 201);
  assert.equal(sent.body.analysis.analysisId, ID);
  assert.equal(sent.body.analysis.status, "uploaded");
  assert.deepEqual(
    calls.map(([kind]) => kind), ["storeSource", "create"],
    "a record must never point at bytes that were not written"
  );
  const [, stored] = calls.find(([kind]) => kind === "storeSource");
  assert.equal(stored.ownerKey, OWNER, "the path is scoped to the hashed uid");
  const [, created] = calls.find(([kind]) => kind === "create");
  assert.equal(created.ownerKey, OWNER);
  assert.equal(created.fileName, "shelf.jpg");
  assert.ok(!Object.hasOwn(created, "bytes"), "bytes must not reach the record store");
});

test("an upload the reader refuses costs no storage and keeps its own code", async () => {
  const { handle, calls } = harness();

  const sent = await send(handle, upload(Buffer.from("not a jpeg at all")));

  assert.equal(sent.status, 400);
  assert.equal(sent.body.error.code, "file_not_jpeg");
  assert.equal(calls.length, 0, "rejection happens before anything is stored");
});

test("an unsupported media type is refused with 415, not silently converted", async () => {
  const { handle } = harness();
  const sent = await send(handle, upload(REAL_JPEG, "image/png"));
  assert.equal(sent.status, 415);
  assert.equal(sent.body.error.code, "media_type_unsupported");
});

test("the first run carries no note; a refine carries the caller's own", async () => {
  const automatic = harness();
  await send(automatic.handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  const [, first] = automatic.calls.find(([kind]) => kind === "run");
  assert.equal(first.ownerKey, OWNER);
  assert.equal(first.analysisId, ID);
  assert.equal(first.context ?? null, null);

  const refine = harness();
  const sent = await send(refine.handle,
    jsonRequest("POST", `${BASE}/${ID}/run`, { context: "ignore the top shelf" }));
  const [, second] = refine.calls.find(([kind]) => kind === "run");
  assert.equal(second.context, "ignore the top shelf");
  assert.equal(sent.status, 200);
  assert.equal(sent.body.analysis.status, "analyzed");
});

test("a note longer than the ceiling is refused rather than truncated", async () => {
  const { handle, calls } = harness();
  const sent = await send(handle,
    jsonRequest("POST", `${BASE}/${ID}/run`, { context: "x".repeat(2_000) }));
  assert.equal(sent.status, 400);
  assert.equal(sent.body.error.code, "context_invalid");
  assert.ok(!calls.some(([kind]) => kind === "run"), "no provider call is spent");
});

test("a provider failure answers with its own code, the record already failed", async () => {
  const timeout = harness({
    runner: { run: async () => { throw new ProviderError("timeout"); } }
  });
  const timedOut = await send(timeout.handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  assert.equal(timedOut.status, 504);
  assert.equal(timedOut.body.error.code, "provider_timeout");
  assert.equal(timedOut.body.error.retryable, true);

  const broken = harness({
    runner: { run: async () => { throw new ProviderError("response"); } }
  });
  const failed = await send(broken.handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  assert.equal(failed.status, 502);
  assert.equal(failed.body.error.code, "provider_failed");
});

test("running an analysis that does not exist is 404, not 500", async () => {
  const { handle } = harness({
    runner: { run: async () => { throw new AgentAnalysisNotFoundError(); } }
  });
  const sent = await send(handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  assert.equal(sent.status, 404);
  assert.equal(sent.body.error.code, "analysis_not_found");
});

test("a run that the record's state forbids is a conflict", async () => {
  const busy = harness({
    runner: { run: async () => { throw new AgentAnalysisStateError("analyzing", "analyzing"); } }
  });
  const sentBusy = await send(busy.handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  assert.equal(sentBusy.status, 409);
  assert.equal(sentBusy.body.error.code, "analysis_state_invalid");

  const exhausted = harness({
    runner: { run: async () => { throw new AgentAnalysisRunLimitError(25); } }
  });
  const sentLimit = await send(exhausted.handle, jsonRequest("POST", `${BASE}/${ID}/run`));
  assert.equal(sentLimit.status, 409);
  assert.equal(sentLimit.body.error.code, "analysis_run_limit");
});

test("unavailable storage is a retryable 503 that never leaks the provider's message", async () => {
  const { handle } = harness({
    evidenceStore: {
      storeSource: async () => {
        throw new AgentEvidenceUnavailableError(new Error("bucket exploded: key=SECRET"));
      }
    }
  });
  const sent = await send(handle, upload());
  assert.equal(sent.status, 503);
  assert.equal(sent.body.error.code, "storage_unavailable");
  assert.equal(sent.body.error.retryable, true);
  assert.ok(!JSON.stringify(sent.body).includes("SECRET"));
});

test("lists and reads only within the caller's own owner key", async () => {
  const mine = harness();
  const listed = await send(mine.handle, jsonRequest("GET", BASE));
  assert.equal(listed.status, 200);
  assert.equal(listed.body.analyses[0].analysisId, ID);
  const [, listInput] = mine.calls.find(([kind]) => kind === "list");
  assert.equal(listInput.ownerKey, OWNER);

  const theirs = harness();
  await send(theirs.handle, jsonRequest("GET", `${BASE}/${ID}`, undefined, "token-b"));
  const [, readInput] = theirs.calls.find(([kind]) => kind === "read");
  assert.equal(readInput.ownerKey, OTHER_OWNER,
    "a second caller reads under their own key and can never name another's");
});

test("a record the caller does not own reads as absent, not as forbidden", async () => {
  const { handle } = harness({ analysisStore: { read: async () => null } });
  const sent = await send(handle, jsonRequest("GET", `${BASE}/${ID}`));
  assert.equal(sent.status, 404);
  assert.equal(sent.body.error.code, "analysis_not_found");
});

test("an identifier that could never be server-generated is refused before any lookup", async () => {
  const { handle, calls } = harness();
  const sent = await send(handle, jsonRequest("GET", `${BASE}/..%2Fother`));
  assert.equal(sent.status, 404);
  assert.equal(calls.length, 0);
});

test("serializes record timestamps rather than emitting Firestore internals", async () => {
  const { handle } = harness();
  const sent = await send(handle, jsonRequest("GET", `${BASE}/${ID}`));
  assert.equal(sent.body.analysis.createdAt, "2026-09-07T12:00:00.000Z");
  assert.equal(sent.body.analysis.runs[0].startedAt, "2026-09-07T12:00:01.000Z");
});

test("an unknown path is 404 and an unsupported method is 405", async () => {
  const { handle } = harness();

  const unknown = await send(handle, jsonRequest("GET", "/v1/agent/other"));
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error.code, "not_found");

  const wrongMethod = await send(handle, jsonRequest("DELETE", `${BASE}/${ID}`));
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.body.error.code, "method_not_allowed");
});

test("every answer forbids caching, including the failures", async () => {
  const { handle } = harness();
  for (const request of [
    jsonRequest("GET", BASE),
    jsonRequest("GET", `${BASE}/${ID}`),
    { method: "GET", url: BASE, headers: {} },
    jsonRequest("GET", "/v1/agent/other")
  ]) {
    const sent = await send(handle, request);
    assert.equal(sent.headers["Cache-Control"], "no-store");
  }
});

test("an unexpected fault answers 500 without carrying its detail to the caller", async () => {
  const { handle } = harness({
    analysisStore: { list: async () => { throw new Error("connection string: SECRET"); } }
  });
  const sent = await send(handle, jsonRequest("GET", BASE));
  assert.equal(sent.status, 500);
  assert.equal(sent.body.error.code, "unexpected_server_error");
  assert.ok(!JSON.stringify(sent.body).includes("SECRET"));
});

test("a refine with no note is the caller's mistake, not a conflict or a fault", async () => {
  const { handle } = harness({
    runner: { run: async () => { throw new AgentAnalysisContextRequiredError(); } }
  });

  const sent = await send(handle, jsonRequest("POST", `${BASE}/${ID}/run`));

  assert.equal(sent.status, 400,
    "409 would say the record is in the wrong state; the remedy is a note");
  assert.equal(sent.body.error.code, "context_required");
  assert.equal(sent.body.error.retryable, false);
});

test("logs the matched route, never the caller's own path", async () => {
  const lines = [];
  const logger = { error: (...args) => lines.push(args), warn: () => {}, info: () => {} };
  const { handle } = harness({ logger });

  await send(handle, jsonRequest("GET", `${BASE}/..%2Fetc-PRIVATE-MARKER`));
  await send(handle, jsonRequest("GET", "/v1/agent/nope-PRIVATE-MARKER"));
  await send(handle, { method: "GET", url: `${BASE}?t=PRIVATE-MARKER`, headers: {} });

  const written = JSON.stringify(lines);
  assert.ok(!written.includes("PRIVATE-MARKER"),
    `caller-controlled path reached the log: ${written}`);
  assert.ok(written.includes("unmatched"),
    "a request matching no route is logged as unmatched");
});

test("serves the caller's own stored image back, private and uncacheable", async () => {
  const BYTES = Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
  const { handle, calls } = harness({
    evidenceStore: {
      readSource: async (input) => {
        calls.push(["readSource", input]);
        return { path: "p", bytes: BYTES, mediaType: "image/jpeg", sha256: "b".repeat(64) };
      }
    }
  });

  const response = responseDouble();
  response.end = function (body) { this.sent.raw = body; };
  await handle(jsonRequest("GET", `${BASE}/${ID}/source`), response);

  assert.equal(response.sent.status, 200);
  assert.equal(response.sent.headers["Content-Type"], "image/jpeg");
  assert.equal(response.sent.headers["Cache-Control"], "private, no-store");
  assert.ok(BYTES.equals(response.sent.raw), "the stored bytes are served unchanged");
  const [, read] = calls.find(([kind]) => kind === "readSource");
  assert.equal(read.ownerKey, OWNER, "the read is scoped to the caller");
});

test("another owner's image is simply not there", async () => {
  const { handle, calls } = harness({
    analysisStore: { read: async ({ ownerKey }) => ownerKey === OWNER ? RECORD : null },
    evidenceStore: { readSource: async () => { throw new Error("must not access storage"); } }
  });
  const sent = await send(handle, jsonRequest("GET", `${BASE}/${ID}/source`, undefined, "token-b"));
  assert.equal(sent.status, 404);
  assert.equal(sent.body.error.code, "analysis_not_found");
});

test("an existing analysis with unreadable source returns storage unavailable", async () => {
  const { handle } = harness({
    evidenceStore: { readSource: async () => {
      throw new AgentEvidenceUnavailableError(new Error("unavailable"));
    } }
  });
  const sent = await send(handle, jsonRequest("GET", `${BASE}/${ID}/source`));
  assert.equal(sent.status, 503);
  assert.equal(sent.body.error.code, "storage_unavailable");
});

test("the source route refuses an unauthenticated caller and a wrong method", async () => {
  const { handle, calls } = harness();

  const anonymous = await send(handle, { method: "GET", url: `${BASE}/${ID}/source`, headers: {} });
  assert.equal(anonymous.status, 401);

  const wrongMethod = await send(handle, jsonRequest("DELETE", `${BASE}/${ID}/source`));
  assert.equal(wrongMethod.status, 405);

  assert.equal(calls.length, 0, "neither reaches storage");
});
