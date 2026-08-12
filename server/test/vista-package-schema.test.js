import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const bundle = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/", import.meta.url
);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, bundle), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(readJson("schemas/manifest-v1.schema.json"));

test("validates the vendored golden manifest without copying its schema", () => {
  assert.equal(validate(readJson("fixtures/valid/manifest.json")), true);
});

test("rejects vendored manifests with an owner or wrong run kind", () => {
  const invalid = [
    "fixtures/invalid/manifest-extra-owner.json",
    "fixtures/invalid/manifest-wrong-run-kind.json"
  ];
  for (const path of invalid) {
    assert.equal(validate(readJson(path)), false, path);
  }
});
