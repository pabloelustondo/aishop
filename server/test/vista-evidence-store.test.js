import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createVistaEvidenceStore } from "../src/vista-evidence-store.js";
import { validateVistaArtifacts } from "../src/vista-artifact-validator.js";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { request } from "../test-support/vista-package-fixture.js";
import { createMemoryVistaBucket } from "../test-support/memory-vista-bucket.js";

const limits = { manifestBytes: 262_144, auditBytes: 5_242_880,
  jpegBytes: 5_242_880, packageBytes: 26_214_400, jpegAxis: 4_096,
  jpegPixels: 16_777_216, artifacts: 40, artifactParts: 40,
  multipartParts: 41 };
const ownerKey = "a77417321dde97958dd3349a2b98a12d2ddbc8d286b4d293a7d24102a7a33224";
const expected = JSON.parse(readFileSync(new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/expected-persistence.json",
  import.meta.url)));

async function packageInput() {
  const value = await readVistaPackageRequest(request(), limits);
  return { ownerKey, ...value,
    artifacts: await validateVistaArtifacts(value, limits) };
}

test("creates exact private hash-named objects without overwrite", async () => {
  const harness = createMemoryVistaBucket();
  const store = createVistaEvidenceStore({ bucket: harness.bucket });
  await store.preservePackage(await packageInput());
  assert.deepEqual(harness.saves.map(({ path }) => path).sort(),
    expected.storageObjects.map(({ path }) => path).sort());
  for (const { options } of harness.saves) {
    assert.equal(options.preconditionOpts.ifGenerationMatch, 0);
    assert.equal(options.metadata.cacheControl, "private, no-store");
  }
  await store.preservePackage(await packageInput());
  assert.equal(harness.saves.length, 3);
});

test("refuses a conflicting pre-existing object", async () => {
  const harness = createMemoryVistaBucket();
  const store = createVistaEvidenceStore({ bucket: harness.bucket });
  const input = await packageInput();
  await store.preservePackage(input);
  harness.objects.values().next().value.bytes = Buffer.from("wrong");
  await assert.rejects(store.preservePackage(input),
    (error) => error.code === "evidence_persistence_unavailable");
});
