import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const infrastructureCodes = ["auth/internal-error", "auth/invalid-credential",
  "auth/insufficient-permission", "app/invalid-credential", "ECONNRESET",
  "ETIMEDOUT", undefined];

async function invoke(code, message = "provider-secret raw-uid /private/stack") {
  const provider = new Error(message, { cause: new Error("nested-secret") });
  provider.code = code;
  const logs = [];
  const harness = createVistaAPIHarness({
    verifyIdToken: async () => { throw provider; },
    logger: { error: (...values) => logs.push(values) }
  });
  const output = responseResult();
  const input = request(undefined, { authorization: "Bearer private-token" });
  input.rawBody = Buffer.from("malformed private body");
  await harness.handler(input, output.response);
  return { harness, logs, result: output.result };
}

test("verifier infrastructure failures are safe retryable 500", async () => {
  for (const code of infrastructureCodes) {
    const { harness, logs, result } = await invoke(code);
    assert.equal(result.status, 500);
    assert.deepEqual(result.body.error, { code: "unexpected_server_error",
      message: "The package could not be received.", retryable: true });
    assert.equal(result.headers["Cache-Control"], "no-store");
    assert.doesNotMatch(JSON.stringify({ body: result.body, logs }),
      /private|secret|token|uid|provider|nested|stack/i);
    assert.equal(harness.database.documents.size + harness.bucket.objects.size, 0);
  }
});

test("certificate-fetch argument error is infrastructure failure", async () => {
  const messages = ["Error fetching public keys for Google certs: provider-secret",
    "Error while making request: getaddrinfo ENOTFOUND provider-secret.",
    "Error while making request: socket hang up. Error code: ECONNRESET"];
  for (const message of messages) {
    const output = await invoke("auth/argument-error", message);
    assert.equal(output.result.status, 500);
    assert.equal(output.result.body.error.retryable, true);
  }
});
