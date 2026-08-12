import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { hash, request, validParts } from "../test-support/vista-package-fixture.js";

const authorization = { authorization: "Bearer valid-fixture-token" };
function conflictingRequest() {
  const parts = validParts();
  const manifest = JSON.parse(parts[0].bytes);
  manifest.completedAt = "2026-08-10T22:31:01Z";
  const bytes = Buffer.from(JSON.stringify(manifest));
  parts[0] = { ...parts[0], bytes };
  return request(parts, { ...authorization, "x-vista-manifest-sha256": hash(bytes) });
}

test("same owner and run with a different valid manifest returns 409", async () => {
  const harness = createVistaAPIHarness();
  const first = responseResult();
  const conflict = responseResult();
  await harness.handler(request(undefined, authorization), first.response);
  await harness.handler(conflictingRequest(), conflict.response);
  assert.equal(first.result.status, 201);
  assert.equal(conflict.result.status, 409);
  assert.equal(conflict.result.body.error.code, "run_manifest_conflict");
  assert.equal(harness.database.documents.size, 1);
});
