import assert from "node:assert/strict";
import test from "node:test";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { request, validParts } from "../test-support/vista-package-fixture.js";

const limits = { manifestBytes: 262_144, auditBytes: 5_242_880,
  jpegBytes: 5_242_880, packageBytes: 104_857_600, jpegAxis: 4_096,
  jpegPixels: 16_777_216, artifacts: 40, artifactParts: 40,
  multipartParts: 41 };
const rejects = (input, code) => assert.rejects(
  readVistaPackageRequest(input, limits), (error) => error.code === code
);

test("multipart framing fails before required headers", async () => {
  const input = request(validParts(), { "idempotency-key": undefined });
  input.rawBody = Buffer.from("not multipart framing");
  await rejects(input, "multipart_invalid");
});

test("manifest hash and idempotency fail before artifact identity", async () => {
  const parts = validParts();
  parts[1] = { ...parts[1], filename: "../untrusted.json" };
  await rejects(request(parts, { "x-vista-manifest-sha256": "a".repeat(64) }),
    "manifest_hash_mismatch");
  await rejects(request(parts, {
    "idempotency-key": "00000000-0000-4000-8000-000000000001"
  }), "idempotency_key_mismatch");
});
