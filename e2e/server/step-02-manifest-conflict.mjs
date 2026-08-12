// Step 02: re-sending the same run with a DIFFERENT manifest must be
// refused with 409 run_manifest_conflict, and the original receipt must
// survive unchanged. A fresh emulator user also proves that step-01's
// earlier upload lives in a different owner namespace.
import assert from "node:assert/strict";
import {
  hash, request, validParts
} from "../../server/test-support/vista-package-fixture.js";
import { mintEmulatorIdToken } from "./emulator-auth.mjs";

const base = process.env.VISTA_E2E_FUNCTION_URL ??
  "http://127.0.0.1:5001/demo-aishop-e2e/northamerica-northeast2/api";

async function submit(spec, token) {
  const response = await fetch(base + spec.url, { method: "POST",
    headers: { ...spec.headers, authorization: `Bearer ${token}` },
    body: spec.rawBody });
  return { status: response.status, body: await response.json() };
}

function tamperedSpec() {
  const parts = validParts();
  const manifest = parts.find((part) => part.name === "manifest");
  const bytes = Buffer.concat([manifest.bytes, Buffer.from(" ")]);
  const tampered = parts.map((part) =>
    part === manifest ? { ...part, bytes } : part);
  return request(tampered, { "x-vista-manifest-sha256": hash(bytes) });
}

const token = await mintEmulatorIdToken();

const original = await submit(request(), token);
assert.equal(original.status, 201,
  `original upload: ${JSON.stringify(original.body)}`);

const conflict = await submit(tamperedSpec(), token);
assert.equal(conflict.status, 409,
  `conflict upload: ${JSON.stringify(conflict.body)}`);
assert.equal(conflict.body.error.code, "run_manifest_conflict");
assert.equal(conflict.body.error.retryable, false);

const after = await submit(request(), token);
assert.equal(after.status, 200, `retry after conflict: ${after.status}`);
assert.deepEqual(after.body, original.body,
  "the conflict must not disturb the original receipt");

console.log("PASS step-02: different manifest for the same run earns 409; original receipt intact.");
