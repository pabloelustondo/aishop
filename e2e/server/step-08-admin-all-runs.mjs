// Step 08 (Sprint 012): the All-runs read side, across owners, behind the
// admin claim.
//
// Two agent owners upload through the real agent composition (fixture
// provider). An account granted `--role admin` with the committed tool
// lists both owners' records with labels, filters them, pages with a
// limit of one, opens a record with its attempt history, and reads the
// stored image. An agent-only account, a reviewer-only account and a
// missing token are refused; a bad cursor and a bad filter are 400; every
// non-GET is 405; nothing an administrator did changed a record.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { API_PROCESS_CONTEXT, createProcessContext } from "../../server/src/firebase-agent-config.js";
import { createFirebaseAdminHandler } from "../../server/src/firebase-admin-handler.js";
import { createFirebaseAgentHandler } from "../../server/src/firebase-agent-handler.js";
import {
  mintEmulatorPasswordUser, mintEmulatorUser, signInEmulatorPassword
} from "./emulator-auth.mjs";

for (const key of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  assert.match(process.env[key] ?? "", /^(127\.0\.0\.1|localhost):\d+$/, `${key} must be local`);
}
const PROJECT = "demo-aishop-e2e";
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` });
const TOOL = new URL("../../server/scripts/agent-access.mjs", import.meta.url).pathname;
const JPEG = readFileSync(new URL(
  "../../server/contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg", import.meta.url));
const JPEG_SHA = createHash("sha256").update(JPEG).digest("hex");
const ownerKeyOf = (uid) => createHash("sha256").update(uid).digest("hex");
const run = promisify(execFile);
const stamp = Date.now();
const PASSWORD = "fixture-password-1";
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const quiet = { info: () => {}, error: () => {} };
const agent = createFirebaseAgentHandler({
  apiKey: "offline-fixture-only", environment: "emulator", release: "fixture", logger: quiet,
  fetchImpl: async () => new Response(JSON.stringify({
    status: "completed", model: "gpt-fixture", usage: { input_tokens: 1, output_tokens: 1 },
    output_text: JSON.stringify({ summary: "fixture", identifiedProducts: [
      { name: "Fixture product", count: 3, confidence: "high", visibleEvidence: ["fixture"] }], uncertainItems: [] })
  }), { status: 200, headers: { "x-request-id": "req_fixture" } })
});
const accessEvents = [];
const admin = createFirebaseAdminHandler({
  environment: "emulator", release: "fixture",
  logger: { write: (event) => { if (event.event === "access.completed") accessEvents.push(event); } }
});
const nextProcessContext = createProcessContext();
const server = createServer(async (request, response) => {
  request[API_PROCESS_CONTEXT] = nextProcessContext();
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  request.rawBody = Buffer.concat(chunks);
  await (request.url.startsWith("/v1/admin") ? admin : agent)(request, response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const call = (idToken, method, path, body) => fetch(origin + path, {
  method,
  headers: { ...(idToken ? { authorization: `Bearer ${idToken}` } : {}) },
  body
});
const adminGet = async (idToken, path) => {
  const response = await call(idToken, "GET", `/v1/admin/analyses${path}`);
  return { status: response.status, headers: response.headers, body: await response.json().catch(() => null) };
};
async function upload(idToken, fields) {
  const form = new FormData();
  form.append("file", new Blob([JPEG], { type: "image/jpeg" }), "shelf.jpg");
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  const response = await call(idToken, "POST", "/v1/agent/analyses", form);
  // Read once: an assertion message is evaluated eagerly, so awaiting
  // `.text()` there drains the body before `.json()` can parse it.
  const body = await response.text();
  assert.equal(response.status, 201, body);
  return JSON.parse(body).analysis;
}
async function tool(action, subject, role) {
  const { stdout } = await run("node", [TOOL, action, subject, "--project", PROJECT, "--role", role],
    { env: { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST } });
  return JSON.parse(stdout.slice(0, stdout.lastIndexOf("}") + 1));
}

try {
  // --- two owners, three records ------------------------------------------
  const emails = { a: `owner-a-${stamp}@example.com`, b: `owner-b-${stamp}@example.com`, admin: `admin-${stamp}@example.com` };
  const users = {};
  for (const [name, email] of Object.entries(emails)) users[name] = await mintEmulatorPasswordUser({ email, password: PASSWORD });
  await tool("grant", emails.a, "agent"); await tool("grant", emails.b, "agent");
  const a = await signInEmulatorPassword({ email: emails.a, password: PASSWORD });
  const b = await signInEmulatorPassword({ email: emails.b, password: PASSWORD });
  const first = await upload(a.idToken, { run: "true", context: "count the blue bottles" });
  const second = await upload(b.idToken, { run: "true" });
  const third = await upload(b.idToken, {});
  assert.equal(first.status, "analyzed"); assert.equal(third.status, "uploaded");
  const keyA = ownerKeyOf(a.uid), keyB = ownerKeyOf(b.uid);

  // --- the admin claim is separate from the agent claim ----------------------
  const beforeGrant = await signInEmulatorPassword({ email: emails.admin, password: PASSWORD });
  assert.equal((await adminGet(beforeGrant.idToken, "")).status, 403, "an account that exists is not an administrator");
  const granted = await tool("grant", emails.admin, "admin");
  assert.deepEqual(granted.claims, { agent: false, admin: true }, "admin does not imply agent");
  const root = await signInEmulatorPassword({ email: emails.admin, password: PASSWORD });
  assert.equal((await call(root.idToken, "GET", "/v1/agent/analyses")).status, 403, "and an administrator is not an uploader");

  // --- list: both owners, labelled, newest first ------------------------------
  const all = await adminGet(root.idToken, "");
  assert.equal(all.status, 200, JSON.stringify(all.body));
  assert.match(all.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/);
  const mine = all.body.analyses.filter((row) => [keyA, keyB].includes(row.ownerKey));
  assert.deepEqual(mine.map((row) => row.analysisId), [third.analysisId, second.analysisId, first.analysisId], "newest first");
  assert.deepEqual(new Set(mine.map((row) => row.owner.label)), new Set([emails.a, emails.b]));
  assert.ok(mine.every((row) => row.owner.kind === "email"));
  assert.ok(!JSON.stringify(all.body).includes(a.uid) && !JSON.stringify(all.body).includes(b.uid), "no uid in any response");

  // --- filters ----------------------------------------------------------------
  const byOwner = await adminGet(root.idToken, `?owner=${keyA}`);
  assert.deepEqual(byOwner.body.analyses.map((row) => row.analysisId), [first.analysisId]);
  const uploaded = await adminGet(root.idToken, `?owner=${keyB}&status=uploaded`);
  assert.deepEqual(uploaded.body.analyses.map((row) => row.analysisId), [third.analysisId]);
  const dated = await adminGet(root.idToken, `?owner=${keyB}&from=${today}&to=${today}`);
  assert.equal(dated.body.analyses.length, 2, "`to` includes the whole day named");
  const future = await adminGet(root.idToken, `?from=${tomorrow}`);
  assert.equal(future.body.analyses.length, 0); assert.equal(future.body.nextCursor, null);
  assert.equal((await adminGet(root.idToken, "?owner=not-a-key")).body.error.code, "filter_invalid");
  assert.equal((await adminGet(root.idToken, "?status=done")).status, 400);
  assert.equal((await adminGet(root.idToken, "?cursor=garbage")).body.error.code, "cursor_invalid");

  // --- pagination by one, across owners, no duplicates, a clean end -----------
  const seen = [];
  let cursor = null;
  for (let page = 0; page < 5; page += 1) {
    const result = await adminGet(root.idToken, `?owner=${keyB}&limit=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    seen.push(...result.body.analyses.map((row) => row.analysisId));
    cursor = result.body.nextCursor;
    if (!cursor) break;
  }
  assert.deepEqual(seen, [third.analysisId, second.analysisId]);
  assert.equal(cursor, null, "the last page carries no cursor");

  // --- detail and source --------------------------------------------------------
  const detail = await adminGet(root.idToken, `/${keyA}/${first.analysisId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.analysis.runs[0].context, "count the blue bottles");
  assert.equal(detail.body.analysis.report.identifiedProducts[0].count, 3);
  assert.equal(detail.body.analysis.owner.label, emails.a);
  const image = await call(root.idToken, "GET", `/v1/admin/analyses/${keyA}/${first.analysisId}/source`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("cache-control"), "private, no-store");
  assert.equal(createHash("sha256").update(Buffer.from(await image.arrayBuffer())).digest("hex"), JPEG_SHA, "the bytes are the bytes");
  assert.equal((await adminGet(root.idToken, `/${keyB}/${first.analysisId}`)).status, 404, "a wrong owner for a real id is not found");

  // --- refusals --------------------------------------------------------------------
  const reviewer = await mintEmulatorUser({ claims: { reviewer: true } });
  for (const [token, who] of [[null, "no token"], [a.idToken, "agent-only"], [reviewer.idToken, "reviewer-only"]]) {
    for (const path of ["", `/${keyA}/${first.analysisId}`, `/${keyA}/${first.analysisId}/source`]) {
      const refused = await call(token, "GET", `/v1/admin/analyses${path}`);
      assert.equal(refused.status, token ? 403 : 401, `${who} ${path || "list"}`);
    }
  }
  for (const method of ["POST", "PUT", "DELETE"]) {
    assert.equal((await call(root.idToken, method, "/v1/admin/analyses")).status, 405, method);
  }

  // --- read-only, and the access log says who did what, by reference ------------
  const unchanged = await (await call(a.idToken, "GET", `/v1/agent/analyses/${first.analysisId}`)).json();
  assert.equal(unchanged.analysis.runCount, 1, "no admin read changed a record");
  const reads = accessEvents.filter((event) => event.operation === "admin.read" && event.httpStatus === 200);
  assert.ok(reads.length >= 1);
  assert.equal(reads[0].actorKey, ownerKeyOf(root.uid));
  assert.equal(reads[0].targetOwnerKey, keyA);
  assert.equal(reads[0].service, "admin");
  const logged = JSON.stringify(accessEvents);
  assert.ok(!logged.includes(emails.admin) && !logged.includes(root.uid) && !logged.includes("garbage"), "references only");

  // --- revocation --------------------------------------------------------------------
  await new Promise((resolve) => setTimeout(resolve, 1_100));
  await tool("revoke", emails.admin, "admin");
  assert.equal((await adminGet(root.idToken, "")).status, 401, "a revoked administrator's token is refused at its next use");

  console.log("PASS step 08: admin lists both owners with labels, filters, pages by one, reads detail and source; "
    + "401/403 for everyone else; 400 on bad cursor and filter; 405 on any write; records unchanged; access log by reference.");
} finally {
  server.close();
}
