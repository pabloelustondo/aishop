import assert from "node:assert/strict";
import test from "node:test";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { appendMultipartField } from "../test-support/vista-multipart-field.js";
import { request } from "../test-support/vista-package-fixture.js";
import { limits } from "../test-support/vista-limit-values.js";

const rejects = (input, code) => assert.rejects(
  readVistaPackageRequest(input, limits), (error) => error.code === code
);

test("required headers win over semantic multipart field errors", async () => {
  const stray = appendMultipartField(request(), "stray");
  delete stray.headers["idempotency-key"];
  await rejects(stray, "idempotency_key_missing");
  await rejects(appendMultipartField(request(undefined,
    { "idempotency-key": "invalid" }), "stray"), "idempotency_key_invalid");
  const artifact = appendMultipartField(request(), "artifact");
  delete artifact.headers["x-vista-manifest-sha256"];
  await rejects(artifact, "manifest_hash_missing");
  await rejects(appendMultipartField(request(undefined,
    { "x-vista-manifest-sha256": "invalid" }), "artifact"),
  "manifest_hash_invalid");
});

test("valid headers preserve stray and filename-less field codes", async () => {
  await rejects(appendMultipartField(request(), "stray"), "multipart_invalid");
  await rejects(appendMultipartField(request(), "artifact"),
    "artifact_identity_invalid");
});
