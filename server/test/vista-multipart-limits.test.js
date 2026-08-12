import assert from "node:assert/strict";
import test from "node:test";
import { readVistaMultipart } from "../src/vista-multipart-reader.js";
import { multipart } from "../test-support/vista-package-fixture.js";
import { limits } from "../test-support/vista-limit-values.js";

function rawRequest(parts) {
  const value = multipart(parts);
  return { headers: { "content-type":
    `multipart/form-data; boundary=${value.boundary}` }, rawBody: value.body };
}

test("accepts the exact per-file byte ceiling and rejects one byte over", async () => {
  const part = (length) => ({ name: "artifact", filename: `${"a".repeat(64)}.jpg`,
    type: "image/jpeg", bytes: Buffer.alloc(length) });
  const input = rawRequest([part(limits.jpegBytes)]);
  const exact = await readVistaMultipart(input, limits);
  assert.equal(exact[0].bytes.length, limits.jpegBytes);
  assert.equal(exact[0].bytes.buffer, input.rawBody.buffer);
  await assert.rejects(readVistaMultipart(
    rawRequest([part(limits.jpegBytes + 1)]), limits),
  (error) => error.code === "package_too_large");
});

test("accepts exactly 41 total parts and rejects part 42", async () => {
  const parts = Array.from({ length: limits.multipartParts }, (_, index) => ({
    name: index === 0 ? "manifest" : "artifact", filename: `${index}.json`,
    type: "application/json", bytes: Buffer.from("[]")
  }));
  assert.equal((await readVistaMultipart(rawRequest(parts), limits)).length, 41);
  await assert.rejects(readVistaMultipart(rawRequest([...parts, parts[1]]), limits),
    (error) => error.code === "package_too_large");
});
