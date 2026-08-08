import assert from "node:assert/strict";
import test from "node:test";
import { createEvidenceReader, EvidenceNotFoundError } from "../src/evidence-reader.js";

test("retrieves exact original bytes through a server-only operation", async () => {
  const original = Buffer.from([0xff, 0xd8, 1, 2, 0xff, 0xd9]);
  let requestedPath;
  const bucket = { file: (path) => ({ download: async () => {
    requestedPath = path;
    return [original];
  } }) };
  const evidence = await createEvidenceReader({ bucket }).readOriginal("scan-1");

  assert.equal(requestedPath, "inspections/scan-1/original.jpg");
  assert.deepEqual(evidence.bytes, original);
  assert.equal(evidence.mediaType, "image/jpeg");
  assert.equal(Object.hasOwn(evidence, "publicUrl"), false);
});

test("maps a missing private object to a stable not-found error", async () => {
  const bucket = { file: () => ({ download: async () => {
    const error = new Error("missing");
    error.code = 404;
    throw error;
  } }) };

  await assert.rejects(
    createEvidenceReader({ bucket }).readOriginal("missing-scan"),
    EvidenceNotFoundError
  );
});
