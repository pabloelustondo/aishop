import assert from "node:assert/strict";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { hash, request, validParts } from "../test-support/vista-package-fixture.js";

const authorization = { authorization: "Bearer valid-fixture-token" };

function repeatedLogicalHashRequest() {
  const parts = validParts();
  const manifest = JSON.parse(parts[0].bytes);
  manifest.artifacts.push({ ...manifest.artifacts[1], id: "second-logical-image" });
  const bytes = Buffer.from(JSON.stringify(manifest));
  parts[0] = { ...parts[0], bytes };
  return request(parts, { ...authorization, "x-vista-manifest-sha256": hash(bytes) });
}

test("one physical artifact satisfies consistent repeated logical SHA descriptors", async () => {
  const harness = createVistaAPIHarness();
  const output = responseResult();
  await harness.handler(repeatedLogicalHashRequest(), output.response);
  assert.equal(output.result.status, 201);
  assert.equal(output.result.body.artifactSha256.length, 2);
  const record = [...harness.database.documents.values()][0];
  assert.equal(record.artifactDescriptors.length, 3);
  assert.equal(harness.bucket.objects.size, 3);
});

test("unsupported artifact media type returns 415 without durable mutation", async () => {
  const harness = createVistaAPIHarness();
  const parts = validParts();
  parts[2] = { ...parts[2], type: "application/octet-stream" };
  const output = responseResult();
  await harness.handler(request(parts, authorization), output.response);
  assert.equal(output.result.status, 415);
  assert.equal(output.result.body.error.code, "unsupported_media_type");
  assert.equal(harness.database.documents.size + harness.bucket.objects.size, 0);
});
