import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateInspectionSubmission } from "../src/inspection-submission.js";

const imageBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url),
  "utf8"
).replace(/\s+/g, "");
const image = { imageBase64, mediaType: "image/jpeg" };

test("accepts exact JPEG evidence and normalized Target position", () => {
  const input = {
    ...image,
    mode: "targetProduct",
    appVersion: "1.2.3 (45)",
    targetPosition: { x: 0.5, y: 0.25 }
  };
  const submission = validateInspectionSubmission(input);

  assert.deepEqual(submission, input);
  assert.deepEqual(
    Buffer.from(submission.imageBase64, "base64"),
    Buffer.from(imageBase64, "base64")
  );
});

test("accepts Area Scan only with an explicit null target", () => {
  const input = {
    ...image,
    mode: "areaScan",
    appVersion: "2.0",
    targetPosition: null
  };
  assert.deepEqual(validateInspectionSubmission(input), input);
});
