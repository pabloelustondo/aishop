import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateVistaManifest } from "../src/vista-manifest-validator.js";

const fixture = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/manifest.json",
  import.meta.url
);

test("runtime ceiling wins before the schema protocol ceiling", () => {
  const manifest = JSON.parse(readFileSync(fixture));
  const image = manifest.artifacts[1];
  while (manifest.artifacts.length <= 100) {
    manifest.artifacts.push({ ...image, id: `image-${manifest.artifacts.length}` });
  }
  assert.throws(() => validateVistaManifest(Buffer.from(JSON.stringify(manifest)),
    { artifacts: 40 }), (error) => error.code === "package_too_large");
});
