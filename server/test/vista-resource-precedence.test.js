import assert from "node:assert/strict";
import test from "node:test";
import { readVistaPackageRequest } from "../src/vista-package-request.js";
import { limits } from "../test-support/vista-limit-values.js";
import { multipart } from "../test-support/vista-package-fixture.js";

const rejectsTooLarge = (input) => assert.rejects(
  readVistaPackageRequest(input, limits), (error) => error.code === "package_too_large"
);
const part = (index, bytes) => ({ name: "artifact",
  filename: `${String(index).padStart(64, "0")}.jpg`,
  type: "image/jpeg", bytes });
function withoutHeaders(parts) {
  const value = multipart(parts);
  return { headers: { "content-type":
    `multipart/form-data; boundary=${value.boundary}` }, rawBody: value.body };
}

test("package and file limits win before missing headers", async () => {
  await rejectsTooLarge({ headers: { "content-type":
    "multipart/form-data; boundary=bounded" },
  rawBody: Buffer.alloc(limits.packageBytes + 1) });
  await rejectsTooLarge(withoutHeaders([
    part(1, Buffer.alloc(limits.jpegBytes + 1))
  ]));
});

test("total-part limit wins before missing headers", async () => {
  const parts = Array.from({ length: limits.multipartParts + 1 }, (_, index) =>
    part(index, Buffer.from("x")));
  await rejectsTooLarge(withoutHeaders(parts));
});
