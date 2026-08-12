import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageAPIHandler } from "../src/vista-package-api-handler.js";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

test("authentication wins before malformed package validation", async () => {
  const harness = createVistaAPIHarness({ verifyIdToken: async () => {
    const error = new Error("invalid token");
    error.code = "auth/invalid-id-token";
    throw error;
  } });
  const output = responseResult();
  const input = request(undefined, { authorization: "Bearer rejected-secret-token" });
  input.rawBody = Buffer.from("malformed body");
  await harness.handler(input, output.response);
  assert.equal(output.result.status, 401);
  assert.equal(output.result.body.error.code, "unauthorized");
  assert.equal(harness.database.documents.size, 0);
  assert.equal(harness.bucket.objects.size, 0);
});

test("unexpected failures return and log only bounded public fields", async () => {
  const logged = [];
  const handler = createVistaPackageAPIHandler({
    verifyIdToken: async () => ({ uid: "private-raw-uid" }),
    submitVistaPackage: async () => { throw new Error("provider-secret-value"); },
    logger: { error: (...values) => logged.push(values) }
  });
  const output = responseResult();
  await handler(request(undefined,
    { authorization: "Bearer private-token" }), output.response);
  assert.equal(output.result.status, 500);
  assert.equal(output.result.body.error.code, "unexpected_server_error");
  assert.equal(output.result.headers["Cache-Control"], "no-store");
  const serialized = JSON.stringify(logged);
  assert.doesNotMatch(serialized, /private|secret|token|uid/i);
});
