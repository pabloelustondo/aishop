import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const authenticatedRequest = () => request(undefined,
  { authorization: "Bearer valid-fixture-token" });

async function invoke(harness) {
  const output = responseResult();
  await harness.handler(authenticatedRequest(), output.response);
  return output.result;
}

test("retry verifies a partial object write and completes the same reservation", async () => {
  const harness = createVistaAPIHarness();
  harness.bucket.failSaveAt(2);
  const failed = await invoke(harness);
  assert.equal(failed.status, 503);
  assert.equal(harness.bucket.objects.size, 1);
  const receiving = [...harness.database.documents.values()][0];
  assert.equal(receiving.status, "receiving");
  const recovered = await invoke(harness);
  assert.equal(recovered.status, 201);
  assert.equal(recovered.body.receiptId, receiving.receiptId);
  assert.equal(harness.bucket.objects.size, 3);
  assert.equal(harness.bucket.saves.length, 3);
});
