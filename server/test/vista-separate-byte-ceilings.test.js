import assert from "node:assert/strict";
import test from "node:test";
import { validateVistaArtifacts } from "../src/vista-artifact-validator.js";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { fixture, request } from "../test-support/vista-package-fixture.js";
import { limits } from "../test-support/vista-limit-values.js";

const rejectsTooLarge = (operation) => assert.rejects(operation,
  (error) => error.code === "package_too_large");

test("manifest bytes have an independent exact ceiling", async () => {
  await rejectsTooLarge(readVistaPackageRequest(request(), {
    ...limits, manifestBytes: fixture.manifest.length - 1
  }));
  const accepted = await readVistaPackageRequest(request(), {
    ...limits, manifestBytes: fixture.manifest.length
  });
  assert.deepEqual(accepted.manifestBytes, fixture.manifest);
});

test("audit bytes have an independent exact ceiling", async () => {
  const packageValue = await readVistaPackageRequest(request(), limits);
  await rejectsTooLarge(validateVistaArtifacts(packageValue, {
    ...limits, auditBytes: fixture.audit.length - 1
  }));
  const accepted = await validateVistaArtifacts(packageValue, {
    ...limits, auditBytes: fixture.audit.length
  });
  assert.equal(accepted.find(({ mediaType }) =>
    mediaType === "application/json").byteLength, fixture.audit.length);
});
