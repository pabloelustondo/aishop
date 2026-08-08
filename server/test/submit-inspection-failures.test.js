import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { InspectionOperationError } from "../src/errors.js";
import { createInspectionSubmitter } from "../src/submit-inspection.js";

const imageBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url), "utf8"
).replace(/\s+/g, "");
const body = {
  imageBase64, mediaType: "image/jpeg", mode: "areaScan",
  appVersion: "1.2 (3)", targetPosition: null
};

function submitter(evidenceStore, recordStore) {
  return createInspectionSubmitter({
    createScanId: () => "00000000-0000-4000-8000-000000000001",
    evidenceStore,
    analyzeInspection: async () => ({ summary: "AI" }),
    recordStore
  });
}

test("labels evidence preservation failures", async () => {
  const submit = submitter({
    preserveOriginal: async () => { throw new Error("bucket detail"); }
  }, {});
  await assert.rejects(submit(body), (error) =>
    error instanceof InspectionOperationError && error.stage === "evidence"
  );
});

test("labels initial record persistence failures", async () => {
  const submit = submitter({
    preserveOriginal: async () => ({ objectPath: "private.jpg" })
  }, {
    createInitial: async () => { throw new Error("database detail"); }
  });
  await assert.rejects(submit(body), (error) =>
    error instanceof InspectionOperationError && error.stage === "record"
  );
});
