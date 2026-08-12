import assert from "node:assert/strict";
import test from "node:test";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { request, validParts } from "../test-support/vista-package-fixture.js";
import { limits } from "../test-support/vista-limit-values.js";

const rejects = (input, code) => assert.rejects(
  readVistaPackageRequest(input, limits), (error) => error.code === code
);

test("missing artifact filename is an identity failure", async () => {
  const parts = validParts();
  parts[1] = { ...parts[1], filename: null };
  await rejects(request(parts), "artifact_identity_invalid");
});

test("any invalid identity wins before a duplicate artifact", async () => {
  const parts = validParts();
  parts.splice(1, 0, { ...parts[1] });
  parts.push({ ...parts[2], filename: "../bad.jpg" });
  await rejects(request(parts), "artifact_identity_invalid");
});
