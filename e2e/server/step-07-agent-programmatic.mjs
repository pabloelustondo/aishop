// Step 07 (Sprint 011): an authorized scripted caller.
//
// Two email/password accounts are created on the Auth emulator. One is
// granted `agent: true` with the committed administrator tool — the real
// tool, as a child process, the way Pablo runs it. That account signs in
// through Firebase's REST sign-in, makes the single call with `run=true`
// and a note through the fixture provider transport, and receives the
// analysed record in one answer. The ungranted account is refused with
// 403 on every route; a third, granted account cannot see the first one's
// record; revoking the first account ends its session.
//
// The provider is a fixture, so "analysed" here proves the plumbing, not
// the recognition. That is exactly what this step is for.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { API_PROCESS_CONTEXT, createProcessContext } from "../../server/src/firebase-agent-config.js";
import { createFirebaseAgentHandler } from "../../server/src/firebase-agent-handler.js";
import { mintEmulatorPasswordUser, signInEmulatorPassword } from "./emulator-auth.mjs";

for (const key of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  assert.match(process.env[key] ?? "", /^(127\.0\.0\.1|localhost):\d+$/, `${key} must be local`);
}
const PROJECT = "demo-aishop-e2e";
const TOOL = new URL("../../server/scripts/agent-access.mjs", import.meta.url).pathname;
const JPEG = readFileSync(new URL(
  "../../server/contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg",
  import.meta.url));
const run = promisify(execFile);
const claimsOf = (idToken) => JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
const stamp = Date.now();
const PASSWORD = "fixture-password-1";

// This directory has no node_modules of its own, so the Admin app is
// initialised the way the function does it: from the environment.
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT, storageBucket: `${PROJECT}.appspot.com` });
const report = { summary: "fixture", identifiedProducts: [
  { name: "Fixture product", count: 2, confidence: "high", visibleEvidence: ["fixture"] }
], uncertainItems: [] };
const handler = createFirebaseAgentHandler({
  apiKey: "offline-fixture-only", environment: "emulator", release: "fixture",
  logger: { info: () => {}, error: () => {} },
  fetchImpl: async () => new Response(JSON.stringify({
    status: "completed", model: "gpt-fixture", usage: { input_tokens: 1, output_tokens: 1 },
    output_text: JSON.stringify(report)
  }), { status: 200, headers: { "x-request-id": "req_fixture" } })
});
const nextProcessContext = createProcessContext();
const server = createServer(async (request, response) => {
  request[API_PROCESS_CONTEXT] = nextProcessContext();
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  request.rawBody = Buffer.concat(chunks);
  await handler(request, response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/v1/agent/analyses`;

const call = (idToken, method, path = "", body) => fetch(base + path, {
  method,
  headers: {
    ...(idToken ? { authorization: `Bearer ${idToken}` } : {}),
    ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {})
  },
  body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
});
const singleCall = (idToken, fields) => {
  const form = new FormData();
  form.append("file", new Blob([JPEG], { type: "image/jpeg" }), "shelf.jpg");
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  return call(idToken, "POST", "", form);
};
async function grant(action, subject) {
  const { stdout } = await run("node", [TOOL, action, subject, "--project", PROJECT],
    { env: { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST } });
  assert.ok(!stdout.includes(PASSWORD), "the tool never prints a password");
  assert.ok(!/eyJ[A-Za-z0-9_-]{20,}/.test(stdout), "the tool never prints a token");
  return JSON.parse(stdout.slice(0, stdout.lastIndexOf("}") + 1));
}

try {
  // --- accounts exist; authorization is a separate, explicit act -----------
  const emailA = `agent-a-${stamp}@example.com`, emailB = `agent-b-${stamp}@example.com`;
  const emailC = `agent-c-${stamp}@example.com`;
  const created = await Promise.all([emailA, emailB, emailC].map((email) =>
    mintEmulatorPasswordUser({ email, password: PASSWORD })));
  const beforeGrant = await call(created[0].idToken, "GET");
  assert.equal(beforeGrant.status, 403, "an account that merely exists is not an agent caller");

  const granted = await grant("grant", emailA);
  assert.equal(granted.uid, created[0].uid);
  assert.deepEqual(granted.claims, { agent: true, admin: false });
  const shown = await grant("show", emailA);
  assert.equal(shown.claims.agent, true, "`show` reports the grant");

  // --- the scripted path: REST sign-in, then one call -----------------------
  const a = await signInEmulatorPassword({ email: emailA, password: PASSWORD });
  assert.equal(claimsOf(a.idToken).agent, true, "the claim is inside the new token");

  const answered = await singleCall(a.idToken, { run: "true", context: "count the blue bottles" });
  // Read the body once. An `await response.text()` passed as an assertion
  // message is evaluated whether or not the assertion fails, so it drains the
  // stream and the later `.json()` throws "Body is unusable".
  const answeredBody = await answered.text();
  assert.equal(answered.status, 201, answeredBody);
  assert.match(answered.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/);
  const { analysis } = JSON.parse(answeredBody);
  assert.equal(analysis.status, "analyzed");
  assert.equal(analysis.runs.length, 1);
  assert.equal(analysis.runs[0].context, "count the blue bottles");
  assert.equal(analysis.report.identifiedProducts[0].count, 2);

  const stored = await singleCall(a.idToken, {});
  assert.equal(stored.status, 201);
  assert.equal((await stored.json()).analysis.status, "uploaded", "without `run` the upload only stores");

  const anonymous = await call(null, "GET");
  assert.equal(anonymous.status, 401);

  // --- the ungranted account: refused everywhere, costs nothing -------------
  const b = await signInEmulatorPassword({ email: emailB, password: PASSWORD });
  for (const [method, path, body] of [
    ["GET", ""], ["GET", `/${analysis.analysisId}`], ["GET", `/${analysis.analysisId}/source`],
    ["POST", `/${analysis.analysisId}/run`, { context: "again" }]
  ]) {
    const refused = await call(b.idToken, method, path, body);
    assert.equal(refused.status, 403, `${method} ${path}`);
    assert.equal((await refused.json()).error.code, "forbidden");
  }
  const refusedUpload = await singleCall(b.idToken, { run: "true" });
  assert.equal(refusedUpload.status, 403);

  // --- a granted stranger: isolation is unchanged ---------------------------
  await grant("grant", emailC);
  const c = await signInEmulatorPassword({ email: emailC, password: PASSWORD });
  const strangers = await call(c.idToken, "GET", `/${analysis.analysisId}`);
  assert.equal(strangers.status, 404, "another owner's analysis is simply not there");

  // --- revocation ends the session, not just the next sign-in ---------------
  await new Promise((resolve) => setTimeout(resolve, 1_100)); // token iat is in whole seconds
  const revoked = await grant("revoke", emailA);
  assert.equal(revoked.claims.agent, false);
  const afterRevoke = await call(a.idToken, "GET");
  assert.equal(afterRevoke.status, 401, "a revoked account's existing token is refused at its next use");

  console.log("PASS step 07: grant with the tool, REST sign-in, single call analysed (fixture provider), "
    + "403 without the claim on every route, 404 across owners, 401 after revocation.");
} finally {
  server.close();
}
