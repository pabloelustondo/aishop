import assert from "node:assert/strict";
import test from "node:test";
import {
  APPROVED_VISTA_PACKAGE_LIMITS,
  readVistaPackageLimits
} from "../src/vista-package-limits.js";

const approvedEnvironment = Object.fromEntries(
  Object.entries(APPROVED_VISTA_PACKAGE_LIMITS)
    .map(([name, { environment, value }]) => [environment, String(value)])
);

test("loads every approved VISTA package limit explicitly", () => {
  assert.deepEqual(readVistaPackageLimits(approvedEnvironment), {
    manifestBytes: 262_144,
    auditBytes: 5_242_880,
    jpegBytes: 5_242_880,
    packageBytes: 26_214_400,
    jpegAxis: 4_096,
    jpegPixels: 16_777_216,
    artifacts: 40,
    artifactParts: 40,
    multipartParts: 41
  });
});

test("fails closed when a limit is missing or invalid", () => {
  const missing = { ...approvedEnvironment };
  delete missing.VISTA_MAX_PACKAGE_BYTES;
  assert.throws(() => readVistaPackageLimits(missing), /VISTA_MAX_PACKAGE_BYTES/);
  assert.throws(
    () => readVistaPackageLimits({ ...approvedEnvironment, VISTA_MAX_JPEG_AXIS: "0" }),
    /VISTA_MAX_JPEG_AXIS/
  );
});
