import assert from "node:assert/strict";
import test from "node:test";
import { ANALYSIS_CONTRACTS } from "../src/analysis-contracts.js";
import { buildInspectionAnalysisRequest } from "../src/inspection-analysis-request.js";

const image = { imageBase64: "jpeg", mediaType: "image/jpeg", appVersion: "1.0" };

test("Target request makes the indicated product primary over a distractor", () => {
  const request = buildInspectionAnalysisRequest({
    ...image,
    mode: "targetProduct",
    targetPosition: { x: 0.5, y: 0.5 }
  }, "test-model");
  const instruction = request.input[0].content[0].text;

  assert.match(instruction, /x=0\.5000, y=0\.5000/);
  assert.match(instruction, /never substitute a more prominent surrounding product/);
  assert.match(instruction, /report uncertainty if the indicated product is unclear/);
  assert.equal(request.store, false);
  assert.equal(request.text.format.strict, true);
  assert.deepEqual(request.text.format.schema, ANALYSIS_CONTRACTS.targetProduct.schema);
});

test("Area request preserves the full-frame instruction", () => {
  const request = buildInspectionAnalysisRequest({
    ...image,
    mode: "areaScan",
    targetPosition: null
  }, "test-model");

  assert.equal(
    request.input[0].content[0].text,
    ANALYSIS_CONTRACTS.areaScan.instruction
  );
  assert.equal(request.text.format.name, "area_scan_report");
});
