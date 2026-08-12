import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const authenticatedRequest = () => request(undefined,
  { authorization: "Bearer valid-fixture-token" });

async function invoke(harness) {
  const response = responseResult();
  await harness.handler(authenticatedRequest(), response.response);
  return response.result;
}

test("storage failure returns 503 and a retry resumes without a false receipt", async () => {
  const harness = createVistaAPIHarness();
  harness.bucket.failNextSave();
  const failed = await invoke(harness);
  assert.equal(failed.status, 503);
  assert.equal(failed.body.error.code, "evidence_persistence_unavailable");
  assert.equal([...harness.database.documents.values()][0].status, "receiving");
  const recovered = await invoke(harness);
  assert.equal(recovered.status, 201);
  assert.equal(recovered.body.status, "received");
});

test("finalization failure recovers by verifying existing immutable objects", async () => {
  const harness = createVistaAPIHarness();
  harness.database.failNextUpdate();
  assert.equal((await invoke(harness)).status, 503);
  assert.equal(harness.bucket.objects.size, 3);
  const recovered = await invoke(harness);
  assert.equal(recovered.status, 201);
  assert.equal(harness.bucket.saves.length, 3);
});
