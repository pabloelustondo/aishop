import assert from "node:assert/strict";
import test from "node:test";
import { readVistaMultipart } from "../src/vista-multipart-reader.js";
import { limits } from "../test-support/vista-limit-values.js";

test("retains only bounded identity for a filename-less field", async () => {
  const boundary = "vista-missing-filename";
  const rawBody = Buffer.from(`--${boundary}\r\n` +
    "Content-Disposition: form-data; name=\"artifact\"\r\n" +
    "Content-Type: image/jpeg\r\n\r\nbytes\r\n" +
    `--${boundary}--\r\n`);
  const parts = await readVistaMultipart({ rawBody, headers: {
    "content-type": `multipart/form-data; boundary=${boundary}`
  } }, limits);
  assert.deepEqual(parts, [{ name: "artifact", filename: null,
    type: "image/jpeg", bytes: Buffer.alloc(0), field: true }]);
});
