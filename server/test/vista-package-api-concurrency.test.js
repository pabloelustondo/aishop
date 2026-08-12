import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const authenticatedRequest = () => request(undefined,
  { authorization: "Bearer valid-fixture-token" });

test("concurrent identical requests converge on one 201 and one 200 receipt", async () => {
  const harness = createVistaAPIHarness();
  const left = responseResult();
  const right = responseResult();
  await Promise.all([harness.handler(authenticatedRequest(), left.response),
    harness.handler(authenticatedRequest(), right.response)]);
  assert.deepEqual([left.result.status, right.result.status].sort(), [200, 201]);
  assert.deepEqual(left.result.body, right.result.body);
  assert.equal(harness.database.documents.size, 1);
  assert.equal(harness.bucket.objects.size, 3);
});

test("the same run is isolated across verified owners", async () => {
  const harness = createVistaAPIHarness({ verifyIdToken: async (token) => ({ uid: token }) });
  const left = responseResult();
  const right = responseResult();
  const forOwner = (owner) => request(undefined, { authorization: `Bearer ${owner}` });
  await harness.handler(forOwner("owner-a"), left.response);
  await harness.handler(forOwner("owner-b"), right.response);
  assert.equal(left.result.status, 201);
  assert.equal(right.result.status, 201);
  assert.equal(harness.database.documents.size, 2);
});
