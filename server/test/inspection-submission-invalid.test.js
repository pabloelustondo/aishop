import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ClientError, ERROR_MESSAGES } from "../src/errors.js";
import { validateInspectionSubmission } from "../src/inspection-submission.js";

const imageBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url), "utf8"
).replace(/\s+/g, "");
const valid = {
  imageBase64,
  mediaType: "image/jpeg",
  mode: "targetProduct",
  appVersion: "1.0",
  targetPosition: { x: 0.5, y: 0.5 }
};

function assertInvalid(input) {
  assert.throws(
    () => validateInspectionSubmission(input),
    (error) => error instanceof ClientError && error.status === 400 &&
      error.message === ERROR_MESSAGES.invalidRequest
  );
}

test("rejects missing, extra, or invalid metadata", () => {
  const { appVersion: _omitted, ...missingVersion } = valid;
  const invalid = [
    missingVersion,
    { ...valid, unexpected: true },
    { ...valid, mode: "unknown" },
    { ...valid, appVersion: "" },
    { ...valid, appVersion: " 1.0" }
  ];
  invalid.forEach(assertInvalid);
});

test("rejects invalid target positions for each mode", () => {
  const invalid = [
    { ...valid, targetPosition: null },
    { ...valid, targetPosition: { x: -0.01, y: 0.5 } },
    { ...valid, targetPosition: { x: 0.5, y: 1.01 } },
    { ...valid, targetPosition: { x: 0.5, y: 0.5, z: 0 } },
    { ...valid, mode: "areaScan", targetPosition: valid.targetPosition }
  ];
  invalid.forEach(assertInvalid);
});
