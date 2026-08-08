import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ClientError, ERROR_MESSAGES } from "../src/errors.js";
import { validateImageInput } from "../src/image-input.js";

const canonical = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url), "utf8"
).replace(/\s+/g, "");
function invalid(error) {
  return error instanceof ClientError && error.message === ERROR_MESSAGES.invalidImage;
}

test("rejects unsupported media types, malformed base64, and non-JPEG bytes", () => {
  const inputs = [
    { imageBase64: canonical, mediaType: "image/png" },
    { imageBase64: "not base64", mediaType: "image/jpeg" },
    { imageBase64: Buffer.from("plain text").toString("base64"), mediaType: "image/jpeg" }
  ];
  for (const input of inputs) {
    assert.throws(() => validateImageInput(input), invalid);
  }
});

test("rejects truncated and malformed JPEG lookalikes", () => {
  const jpeg = Buffer.from(canonical, "base64");
  const badLength = Buffer.from(jpeg);
  badLength[4] = 0xff;
  badLength[5] = 0xff;
  const scan = jpeg.lastIndexOf(Buffer.from([0xff, 0xda]));
  const scanEnd = scan + 2 + jpeg.readUInt16BE(scan + 2);
  const inputs = [
    jpeg.subarray(0, -2),
    Buffer.concat([jpeg, Buffer.from([0x00])]),
    badLength,
    Buffer.concat([jpeg.subarray(0, scanEnd), Buffer.from([0xff, 0xd9])]),
    Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9])
  ];
  for (const bytes of inputs) {
    assert.throws(() => validateImageInput({
      imageBase64: bytes.toString("base64"), mediaType: "image/jpeg"
    }), invalid);
  }
});
