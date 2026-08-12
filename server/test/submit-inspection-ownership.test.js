import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ProviderError } from "../src/errors.js";
import { createInspectionSubmitter } from "../src/submit-inspection.js";

const imageBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url), "utf8"
).replace(/\s+/g, "");
const body = {
  imageBase64, mediaType: "image/jpeg", mode: "targetProduct",
  appVersion: "1.2 (3)", targetPosition: { x: 0.5, y: 0.5 }
};

function harness(analyzeInspection) {
  const calls = [];
  const submit = createInspectionSubmitter({
    createScanId: () => "00000000-0000-4000-8000-000000000001",
    evidenceStore: { preserveOriginal: async () => (
      { objectPath: "private.jpg", sha256: "hash", byteLength: 1 }
    ) },
    analyzeInspection,
    recordStore: {
      createInitial: async (value) => calls.push(["initial", value]),
      createFailure: async (value) => calls.push(["failure", value])
    }
  });
  return { submit, calls };
}

test("attaches the caller's ownerId to the initial record", async () => {
  const { submit, calls } = harness(async () => ({ summary: "AI output" }));
  await submit(body, "customer-1");
  assert.equal(calls[0][1].ownerId, "customer-1");
});

test("attaches the caller's ownerId to a failure record", async () => {
  const { submit, calls } = harness(async () => { throw new ProviderError("timeout"); });
  await assert.rejects(submit(body, "customer-1"), ProviderError);
  assert.equal(calls[0][1].ownerId, "customer-1");
});
