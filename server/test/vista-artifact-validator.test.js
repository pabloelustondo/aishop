import assert from "node:assert/strict";
import test from "node:test";
import { validateVistaArtifacts } from "../src/vista-artifact-validator.js";
import { hash, request } from "../test-support/vista-package-fixture.js";
import { readVistaPackageRequest } from "../src/vista-package-request.js";

const limits = { manifestBytes: 262_144, auditBytes: 5_242_880,
  jpegBytes: 5_242_880, packageBytes: 104_857_600, jpegAxis: 4_096,
  jpegPixels: 16_777_216, artifacts: 40, artifactParts: 40,
  multipartParts: 41 };

test("verifies the vendored audit and JPEG in lexical hash order", async () => {
  const packageValue = await readVistaPackageRequest(request(), limits);
  const artifacts = await validateVistaArtifacts(packageValue, limits);
  assert.deepEqual(artifacts.map(({ sha256 }) => sha256),
    [...artifacts.map(({ sha256 }) => sha256)].sort());
  assert.deepEqual(artifacts.map(({ byteLength }) => byteLength), [865, 2553]);
});

function singleArtifact(bytes, descriptor, part = {}) {
  const sha256 = descriptor.sha256;
  return { manifest: { descriptorsByHash: new Map([[sha256, descriptor]]) },
    artifacts: [{ claimedSha256: sha256, type: descriptor.mediaType,
      filename: `${sha256}.${descriptor.mediaType === "image/jpeg" ? "jpg" : "json"}`,
      bytes, ...part }] };
}

test("byte count wins over hash and audit syntax errors", async () => {
  const bytes = Buffer.from("not-json");
  const descriptor = { kind: "audit/events", mediaType: "application/json",
    sha256: "a".repeat(64), byteCount: bytes.length + 1 };
  await assert.rejects(validateVistaArtifacts(singleArtifact(bytes, descriptor), limits),
    (error) => error.code === "artifact_byte_count_mismatch");
  descriptor.byteCount = bytes.length;
  await assert.rejects(validateVistaArtifacts(singleArtifact(bytes, descriptor), limits),
    (error) => error.code === "artifact_hash_mismatch");
  descriptor.sha256 = hash(bytes);
  await assert.rejects(validateVistaArtifacts(singleArtifact(bytes, descriptor), limits),
    (error) => error.code === "audit_json_invalid");
});
