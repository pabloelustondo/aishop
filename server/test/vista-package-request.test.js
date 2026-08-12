import assert from "node:assert/strict";
import test from "node:test";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { request, validParts } from "../test-support/vista-package-fixture.js";

const limits = { manifestBytes: 262_144, auditBytes: 5_242_880,
  jpegBytes: 5_242_880, packageBytes: 26_214_400, jpegAxis: 4_096,
  jpegPixels: 16_777_216, artifacts: 40, artifactParts: 40,
  multipartParts: 41 };
const fails = async (input, code) => assert.rejects(
  readVistaPackageRequest(input, limits), (error) => error.code === code
);

test("reads the exact vendored multipart package", async () => {
  const value = await readVistaPackageRequest(request(), limits);
  assert.equal(value.runId, "2c11d24c-86da-4ae9-9be4-d67308e27389");
  assert.equal(value.artifacts.length, 2);
  assert.equal(value.manifest.artifacts.length, 2);
});

test("enforces outer media type and required header syntax", async () => {
  await fails(request(validParts(), { "content-type": "application/json" }),
    "unsupported_media_type");
  await fails(request(validParts(), { "idempotency-key": undefined }),
    "idempotency_key_missing");
  await fails(request(validParts(), { "idempotency-key": "bad" }),
    "idempotency_key_invalid");
  await fails(request(validParts(), { "x-vista-manifest-sha256": "BAD" }),
    "manifest_hash_invalid");
});

test("rejects duplicate manifest and invalid artifact identity", async () => {
  await fails(request([...validParts(), validParts()[0]]),
    "manifest_part_count_invalid");
  const parts = validParts();
  parts[1] = { ...parts[1], filename: "../audit.json" };
  await fails(request(parts), "artifact_identity_invalid");
});

test("rejects missing, unexpected, and duplicate physical artifacts", async () => {
  await fails(request(validParts().slice(0, 2)), "artifact_missing");
  await fails(request([...validParts(), validParts()[1]]), "artifact_duplicate");
  const parts = validParts();
  parts.push({ name: "artifact", filename: `${"a".repeat(64)}.jpg`,
    type: "image/jpeg", bytes: Buffer.from("extra") });
  await fails(request(parts), "artifact_unexpected");
});
