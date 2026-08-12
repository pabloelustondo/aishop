import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const input = () => request(undefined, { authorization: "Bearer private-token" });
const knownInvalid = ["auth/argument-error", "auth/id-token-expired",
  "auth/id-token-revoked", "auth/invalid-id-token",
  "auth/mismatching-tenant-id", "auth/user-disabled", "auth/user-not-found"];

async function invoke(error) {
  const harness = createVistaAPIHarness({ verifyIdToken: async () => { throw error; } });
  const output = responseResult();
  await harness.handler(input(), output.response);
  return output.result;
}

test("known invalid Firebase credentials remain non-retryable 401", async () => {
  for (const code of knownInvalid) {
    const error = new Error("private provider detail"); error.code = code;
    const result = await invoke(error);
    assert.equal(result.status, 401);
    assert.deepEqual(result.body.error,
      { code: "unauthorized", message: "Authentication is required.", retryable: false });
  }
});
