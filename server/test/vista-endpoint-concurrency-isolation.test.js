import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { hash, request, validParts } from "../test-support/vista-package-fixture.js";

const authorization = { authorization: "Bearer valid-fixture-token" };
const ownerKey = (uid) => createHash("sha256").update(uid).digest("hex");

function conflictingRequest() {
  const parts = validParts();
  const manifest = JSON.parse(parts[0].bytes);
  manifest.completedAt = "2026-08-10T22:31:01Z";
  const bytes = Buffer.from(JSON.stringify(manifest));
  parts[0] = { ...parts[0], bytes };
  return request(parts, { ...authorization, "x-vista-manifest-sha256": hash(bytes) });
}

async function invoke(harness, input) {
  const output = responseResult();
  await harness.handler(input, output.response);
  return output.result;
}

test("endpoint-level concurrent different hashes produce one receipt and one conflict", async () => {
  const harness = createVistaAPIHarness();
  const results = await Promise.all([
    invoke(harness, request(undefined, authorization)),
    invoke(harness, conflictingRequest())
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [201, 409]);
  assert.equal(harness.database.documents.size, 1);
  assert.equal(harness.bucket.objects.size, 3);
});

test("same run under two owners uses isolated object prefixes", async () => {
  const harness = createVistaAPIHarness({ verifyIdToken: async (uid) => ({ uid }) });
  const owners = ["owner-a", "owner-b"];
  const results = await Promise.all(owners.map((uid) => invoke(harness,
    request(undefined, { authorization: `Bearer ${uid}` }))));
  assert.deepEqual(results.map(({ status }) => status), [201, 201]);
  const paths = [...harness.bucket.objects.keys()];
  for (const uid of owners) assert.equal(paths.filter((path) => path.startsWith(
    `vista/inspection-packages/${ownerKey(uid)}/`)).length, 3);
  assert.equal(new Set(paths).size, 6);
});
