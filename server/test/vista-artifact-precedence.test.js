import assert from "node:assert/strict";
import test from "node:test";
import { validateVistaArtifacts } from "../src/vista-artifact-validator.js";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { request, validParts } from "../test-support/vista-package-fixture.js";

const limits = { manifestBytes: 262_144, auditBytes: 5_242_880,
  jpegBytes: 5_242_880, packageBytes: 26_214_400, jpegAxis: 4_096,
  jpegPixels: 16_777_216, artifacts: 40, artifactParts: 40,
  multipartParts: 41 };
async function rejects(part, code) {
  const parts = validParts();
  parts[1] = part(parts[1]);
  const parsed = await readVistaPackageRequest(request(parts), limits);
  await assert.rejects(async () => validateVistaArtifacts(parsed, limits),
    (error) => error.code === code);
}

test("byte count wins over artifact media type", async () => {
  await rejects((part) => ({ ...part, type: "text/plain",
    bytes: part.bytes.subarray(1) }), "artifact_byte_count_mismatch");
});

test("hash wins over artifact media type", async () => {
  await rejects((part) => { const bytes = Buffer.from(part.bytes); bytes[0] ^= 1;
    return { ...part, type: "text/plain", bytes }; }, "artifact_hash_mismatch");
});
