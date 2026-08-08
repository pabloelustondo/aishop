import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createEvidenceStore, EvidenceAlreadyExistsError } from "../src/evidence-store.js";

test("preserves exact bytes under a private non-overwriting path", async () => {
  const original = Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
  let saved;
  const bucket = { file: (path) => ({ save: async (bytes, options) => {
    saved = { path, bytes, options };
  } }) };
  const store = createEvidenceStore({ bucket });
  const evidence = await store.preserveOriginal({
    scanId: "scan-123",
    imageBase64: original.toString("base64")
  });

  assert.deepEqual(saved.bytes, original);
  assert.equal(saved.path, "inspections/scan-123/original.jpg");
  assert.equal(saved.options.preconditionOpts.ifGenerationMatch, 0);
  assert.equal(saved.options.metadata.cacheControl, "private, no-store");
  assert.equal(evidence.sha256, createHash("sha256").update(original).digest("hex"));
  assert.equal(saved.options.metadata.metadata.sha256, evidence.sha256);
  assert.equal(evidence.byteLength, original.length);
});

test("reports an attempted overwrite as an evidence conflict", async () => {
  const bucket = { file: () => ({ save: async () => {
    const error = new Error("precondition failed");
    error.code = 412;
    throw error;
  } }) };
  const store = createEvidenceStore({ bucket });

  await assert.rejects(
    store.preserveOriginal({ scanId: "scan-123", imageBase64: "/9g=" }),
    EvidenceAlreadyExistsError
  );
});
