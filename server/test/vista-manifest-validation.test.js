import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateVistaManifest } from "../src/vista-manifest-validator.js";

const root = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/", import.meta.url
);
const read = (path) => readFileSync(new URL(path, root));
const limits = { artifacts: 40 };
const rejects = (bytes, code = "manifest_invalid") => assert.throws(
  () => validateVistaManifest(bytes, limits), (error) => error.code === code
);

test("accepts the vendored manifest and normalizes its run identity", () => {
  const result = validateVistaManifest(read("valid/manifest.json"), limits);
  assert.equal(result.runId, "2C11D24C-86DA-4AE9-9BE4-D67308E27389");
  assert.equal(result.normalizedRunId, "2c11d24c-86da-4ae9-9be4-d67308e27389");
});

test("rejects the vendored owner and run-kind mutations", () => {
  rejects(read("invalid/manifest-extra-owner.json"));
  rejects(read("invalid/manifest-wrong-run-kind.json"));
});

test("rejects duplicate ids and inconsistent repeated hashes", () => {
  const manifest = JSON.parse(read("valid/manifest.json"));
  manifest.artifacts.push({ ...manifest.artifacts[1] });
  rejects(Buffer.from(JSON.stringify(manifest)));
  manifest.artifacts[2].id = "second-id";
  manifest.artifacts[2].byteCount += 1;
  rejects(Buffer.from(JSON.stringify(manifest)));
});

test("maps the approved runtime artifact ceiling to package_too_large", () => {
  const manifest = JSON.parse(read("valid/manifest.json"));
  const image = manifest.artifacts[1];
  while (manifest.artifacts.length <= 40) {
    manifest.artifacts.push({ ...image, id: `image-${manifest.artifacts.length}` });
  }
  rejects(Buffer.from(JSON.stringify(manifest)), "package_too_large");
});
