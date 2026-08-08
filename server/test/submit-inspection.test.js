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
    evidenceStore: { preserveOriginal: async (value) => {
      calls.push(["evidence", value]);
      return { objectPath: "private.jpg", sha256: "hash", byteLength: 1 };
    } },
    analyzeInspection,
    recordStore: {
      createInitial: async (value) => calls.push(["initial", value]),
      createFailure: async (value) => calls.push(["failure", value])
    }
  });
  return { submit, calls };
}

test("stores evidence before analysis and persists immutable initial output", async () => {
  const report = { summary: "AI output" };
  const { submit, calls } = harness(async () => {
    calls.push(["analysis"]);
    return report;
  });
  const result = await submit(body);
  assert.deepEqual(calls.map(([kind]) => kind), ["evidence", "analysis", "initial"]);
  assert.equal(calls[2][1].initialFindings, report);
  assert.equal(result.scanId, "00000000-0000-4000-8000-000000000001");
});

test("persists an analysis failure without inventing initial findings", async () => {
  const { submit, calls } = harness(async () => { throw new ProviderError("timeout"); });
  await assert.rejects(submit(body), ProviderError);
  const failure = calls.find(([kind]) => kind === "failure")[1];
  assert.deepEqual(failure.failure, { stage: "analysis", code: "timeout" });
  assert.equal(Object.hasOwn(failure, "initialFindings"), false);
});
