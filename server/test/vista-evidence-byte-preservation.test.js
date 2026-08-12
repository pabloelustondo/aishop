import assert from "node:assert/strict";
import test from "node:test";
import { createVistaEvidenceStore } from "../src/vista-evidence-store.js";
import { validateVistaArtifacts } from "../src/vista-artifact-validator.js";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { createMemoryVistaBucket } from "../test-support/memory-vista-bucket.js";
import { fixture, hash, request } from "../test-support/vista-package-fixture.js";
import { limits } from "../test-support/vista-limit-values.js";

const ownerKey = "a77417321dde97958dd3349a2b98a12d2ddbc8d286b4d293a7d24102a7a33224";

test("persists the submitted JPEG and never decoded raw pixels", async () => {
  const packageValue = await readVistaPackageRequest(request(), limits);
  const artifacts = await validateVistaArtifacts(packageValue, limits);
  const harness = createMemoryVistaBucket();
  await createVistaEvidenceStore({ bucket: harness.bucket })
    .preservePackage({ ...packageValue, ownerKey, artifacts });
  const saved = harness.saves.find(({ path }) =>
    path.endsWith(`/artifacts/${hash(fixture.jpeg)}`));
  assert.deepEqual(saved.bytes, fixture.jpeg);
  assert.equal(saved.options.metadata.contentType, "image/jpeg");
  assert.deepEqual(new Set(harness.saves.map(({ bytes }) => hash(bytes))),
    new Set([hash(fixture.manifest), hash(fixture.audit), hash(fixture.jpeg)]));
});
