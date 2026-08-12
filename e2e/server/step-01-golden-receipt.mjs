// Step 01: the golden package earns a 201 receipt over real HTTP,
// an identical retry returns the same receipt with 200, and a missing
// token is refused with 401. Runs inside `firebase emulators:exec`.
import assert from "node:assert/strict";
import { request } from "../../server/test-support/vista-package-fixture.js";
import { mintEmulatorIdToken } from "./emulator-auth.mjs";

const base = process.env.VISTA_E2E_FUNCTION_URL ??
  "http://127.0.0.1:5001/demo-aishop-e2e/northamerica-northeast2/api";

async function submit(spec, token) {
  const headers = token
    ? { ...spec.headers, authorization: `Bearer ${token}` } : spec.headers;
  const response = await fetch(base + spec.url, {
    method: "POST", headers, body: spec.rawBody
  });
  return { status: response.status,
    cacheControl: response.headers.get("cache-control"),
    body: await response.json() };
}

const token = await mintEmulatorIdToken();
const spec = request();

const first = await submit(spec, token);
assert.equal(first.status, 201, `first upload: ${JSON.stringify(first.body)}`);
assert.equal(first.cacheControl, "no-store");
assert.equal(first.body.status, "received");
assert.match(first.body.receiptId,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
assert.equal(first.body.manifestSha256, spec.headers["x-vista-manifest-sha256"]);
assert.equal(first.body.artifactSha256.length, 2);

const retry = await submit(spec, token);
assert.equal(retry.status, 200, `retry: ${JSON.stringify(retry.body)}`);
assert.deepEqual(retry.body, first.body,
  "an identical retry must return the identical receipt");

const unauthenticated = await submit(spec, null);
assert.equal(unauthenticated.status, 401,
  `unauthenticated: ${JSON.stringify(unauthenticated.body)}`);
assert.equal(unauthenticated.body.error.code, "unauthorized");

console.log("PASS step-01: 201 golden receipt, identical 200 retry, 401 without a token.");
