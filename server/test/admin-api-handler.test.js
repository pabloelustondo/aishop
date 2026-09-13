import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createAdminAPIHandler } from "../src/admin-api-handler.js";
import { AgentEvidenceUnavailableError } from "../src/agent-evidence-store.js";
import { adminError } from "../src/admin-api-error.js";

const BASE = "/v1/admin/analyses";
const OWNER = "a".repeat(64), OTHER = "b".repeat(64);
const ID = "0123456789abcdef0123456789abcdef";
const ADMIN_UID = "admin-uid";
const ACTOR = createHash("sha256").update(ADMIN_UID).digest("hex");

const RECORD = Object.freeze({
  ownerKey: OWNER, analysisId: ID, status: "analyzed", fileName: "shelf.jpg", mediaType: "image/jpeg",
  sha256: "c".repeat(64), byteLength: 10, width: 100, height: 100,
  createdAt: { toDate: () => new Date("2026-09-10T12:00:00Z") }, analyzedAt: null, failureReason: null,
  model: "gpt-test", mode: "areaScan", report: { summary: "one", identifiedProducts: [], uncertainItems: [] },
  runCount: 1, runs: [{ runNumber: 1, context: "note", status: "analyzed", startedAt: null, endedAt: null, diagnostics: null }]
});

const TOKENS = {
  "admin-token": { uid: ADMIN_UID, admin: true },
  "agent-token": { uid: "agent-uid", agent: true },
  "reviewer-token": { uid: "reviewer-uid", reviewer: true },
  "both-token": { uid: "both-uid", agent: true, admin: true },
  "string-token": { uid: "s-uid", admin: "true" }
};

function harness(overrides = {}) {
  const calls = [];
  const events = [];
  const reader = {
    list: async (input) => { calls.push(["list", input]); return { analyses: [RECORD, { ...RECORD, ownerKey: OTHER }], nextCursor: "next" }; },
    read: async (input) => { calls.push(["read", input]); return input.ownerKey === OWNER ? RECORD : null; },
    ...overrides.reader
  };
  const identity = {
    labelsFor: async (keys) => { calls.push(["labelsFor", keys]); return Object.fromEntries(keys.map((k) => [k, { label: k === OWNER ? "one@example.com" : null, kind: k === OWNER ? "email" : "anonymous" }])); }
  };
  const evidenceStore = {
    readSource: async (input) => { calls.push(["readSource", input]); return { bytes: Buffer.from("JPEGBYTES"), mediaType: "image/jpeg", sha256: "d".repeat(64) }; },
    ...overrides.evidenceStore
  };
  const handle = createAdminAPIHandler({
    reader, identity, evidenceStore,
    verifyIdToken: overrides.verifyIdToken ?? (async (token) => { if (!TOKENS[token]) throw Object.assign(new Error("bad"), { code: "auth/invalid-id-token" }); return TOKENS[token]; }),
    diagnostics: (event, fields) => events.push({ event, ...fields }),
    project: "demo-aishop-e2e", logger: { error: () => {} }
  });
  return { handle, calls, events };
}

const request = (url, token = "admin-token", method = "GET") => ({
  method, url, headers: token ? { authorization: `Bearer ${token}` } : {}
});

async function send(handle, req) {
  const sent = {};
  await handle(req, {
    writeHead(status, headers) { sent.status = status; sent.headers = headers; },
    end(body) { sent.body = Buffer.isBuffer(body) ? body : body ? JSON.parse(body) : null; }
  });
  return sent;
}

test("every route checks the claim before touching any store: 401 without a token, 403 without admin", async () => {
  const { handle, calls } = harness();
  const routes = [BASE, `${BASE}/${OWNER}/${ID}`, `${BASE}/${OWNER}/${ID}/source`];
  for (const url of routes) {
    assert.equal((await send(handle, request(url, null))).status, 401, url);
    for (const token of ["agent-token", "reviewer-token", "string-token"]) {
      const refused = await send(handle, request(url, token));
      assert.equal(refused.status, 403, `${token} ${url}`);
      assert.equal(refused.body.error.code, "forbidden");
      assert.equal(refused.body.error.message, "The account is not authorized to view all runs.");
    }
  }
  assert.equal(calls.length, 0, "a refused request reads nothing");
});

test("an administrator lists across owners with labels and a next cursor; the uid never appears", async () => {
  const { handle, calls } = harness();
  const sent = await send(handle, request(`${BASE}?status=analyzed&limit=2&owner=${OWNER}`));
  assert.equal(sent.status, 200);
  assert.equal(sent.body.analyses.length, 2);
  assert.deepEqual(sent.body.analyses[0].owner, { label: "one@example.com", kind: "email" });
  assert.deepEqual(sent.body.analyses[1].owner, { label: null, kind: "anonymous" });
  assert.equal(sent.body.analyses[0].createdAt, "2026-09-10T12:00:00.000Z");
  assert.equal(sent.body.nextCursor, "next");
  assert.deepEqual(calls[0], ["list", { status: "analyzed", limit: "2", owner: OWNER }]);
  assert.ok(!JSON.stringify(sent.body).includes("uid"));
});

test("an account holding both claims is an administrator here and an uploader there", async () => {
  const { handle } = harness();
  assert.equal((await send(handle, request(BASE, "both-token"))).status, 200);
});

test("reads one record with every run, or 404 when the pair names nothing", async () => {
  const { handle } = harness();
  const found = await send(handle, request(`${BASE}/${OWNER}/${ID}`));
  assert.equal(found.status, 200);
  assert.equal(found.body.analysis.runs[0].context, "note");
  assert.equal(found.body.analysis.owner.kind, "email");
  const missing = await send(handle, request(`${BASE}/${OTHER}/${ID}`));
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, "analysis_not_found");
  const malformed = await send(handle, request(`${BASE}/not-a-key/${ID}`));
  assert.equal(malformed.status, 404);
});

test("serves the stored image for an existing record, and never for a missing one", async () => {
  const { handle, calls } = harness();
  const sent = await send(handle, request(`${BASE}/${OWNER}/${ID}/source`));
  assert.equal(sent.status, 200);
  assert.equal(sent.headers["Content-Type"], "image/jpeg");
  assert.equal(sent.headers["Cache-Control"], "private, no-store");
  assert.equal(sent.body.toString(), "JPEGBYTES");
  const missing = await send(handle, request(`${BASE}/${OTHER}/${ID}/source`));
  assert.equal(missing.status, 404);
  assert.ok(!calls.some(([name, input]) => name === "readSource" && input.ownerKey === OTHER));
});

test("filters and cursors the reader refuses keep their own codes; storage faults are 503", async () => {
  const { handle } = harness({ reader: { list: async () => { throw adminError("cursor_invalid"); } } });
  const sent = await send(handle, request(`${BASE}?cursor=garbage`));
  assert.equal(sent.status, 400);
  assert.equal(sent.body.error.code, "cursor_invalid");
  const broken = harness({ evidenceStore: { readSource: async () => { throw new AgentEvidenceUnavailableError(new Error("bucket gs://secret")); } } });
  const failed = await send(broken.handle, request(`${BASE}/${OWNER}/${ID}/source`));
  assert.equal(failed.status, 503);
  assert.ok(!JSON.stringify(failed.body).includes("secret"));
});

test("there is no write: any non-GET is 405, unknown paths are 404", async () => {
  const { handle, calls } = harness();
  for (const [url, method] of [[BASE, "POST"], [`${BASE}/${OWNER}/${ID}`, "DELETE"], [`${BASE}/${OWNER}/${ID}/source`, "PUT"]]) {
    assert.equal((await send(handle, request(url, "admin-token", method))).status, 405, `${method} ${url}`);
  }
  assert.equal((await send(handle, request(`${BASE}/${OWNER}`))).status, 404);
  assert.equal((await send(handle, request(`${BASE}/${OWNER}/${ID}/run`))).status, 404);
  assert.equal((await send(handle, request("/v1/admin/users"))).status, 404);
  assert.equal(calls.length, 0);
});

test("one access event per request: hashed actor, operation, target, outcome — and no filter text", async () => {
  const { handle, events } = harness();
  const sent = await send(handle, request(`${BASE}/${OWNER}/${ID}?owner=PRIVATE`));
  const [event] = events;
  assert.equal(events.length, 1);
  assert.equal(event.event, "access.completed");
  assert.equal(event.actorKey, ACTOR);
  assert.equal(event.operation, "admin.read");
  assert.equal(event.targetOwnerKey, OWNER);
  assert.equal(event.analysisId, ID);
  assert.equal(event.httpStatus, 200);
  assert.equal(event.requestId, sent.headers["X-Request-ID"]);
  assert.equal(event.route, `GET ${BASE}/{ownerKey}/{analysisId}`);
  assert.ok(!JSON.stringify(event).includes("PRIVATE"));

  const refused = harness();
  await send(refused.handle, request(BASE, "agent-token"));
  assert.equal(refused.events[0].accessErrorCode, "forbidden");
  assert.equal(refused.events[0].actorKey, undefined, "a refused caller is not an actor");
});

test("a verifier fault is 500 and a bad credential is 401, exactly as on the agent routes", async () => {
  const revoked = harness({ verifyIdToken: async () => { throw Object.assign(new Error("r"), { code: "auth/id-token-revoked" }); } });
  assert.equal((await send(revoked.handle, request(BASE))).status, 401);
  const down = harness({ verifyIdToken: async () => { throw Object.assign(new Error("Error fetching public keys for Google certs: x"), { code: "auth/argument-error" }); } });
  assert.equal((await send(down.handle, request(BASE))).status, 500);
});
