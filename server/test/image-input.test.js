import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ClientError, ERROR_MESSAGES } from "../src/errors.js";
import { validateImageInput } from "../src/image-input.js";

const tinyJpegBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url),
  "utf8"
).replace(/\s+/g, "");

test("accepts a canonical base64 JPEG", () => {
  const input = { imageBase64: tinyJpegBase64, mediaType: "image/jpeg" };
  assert.deepEqual(validateImageInput(input), input);
});

test("rejects unsupported media types, malformed base64, and non-JPEG bytes", () => {
  const invalidInputs = [
    { imageBase64: tinyJpegBase64, mediaType: "image/png" },
    { imageBase64: "not base64", mediaType: "image/jpeg" },
    { imageBase64: Buffer.from("plain text").toString("base64"), mediaType: "image/jpeg" }
  ];

  for (const input of invalidInputs) {
    assert.throws(
      () => validateImageInput(input),
      (error) => error instanceof ClientError &&
        error.status === 400 &&
        error.message === ERROR_MESSAGES.invalidImage
    );
  }
});

test("rejects truncated and malformed JPEG lookalikes", () => {
  const realJpeg = Buffer.from(tinyJpegBase64, "base64");
  const badLength = Buffer.from(realJpeg);
  badLength[4] = 0xff;
  badLength[5] = 0xff;
  const scanMarker = realJpeg.lastIndexOf(Buffer.from([0xff, 0xda]));
  const scanEnd = scanMarker + 2 + realJpeg.readUInt16BE(scanMarker + 2);
  const emptyScan = Buffer.concat([
    realJpeg.subarray(0, scanEnd),
    Buffer.from([0xff, 0xd9])
  ]);
  const invalidJpegs = [
    realJpeg.subarray(0, -2),
    Buffer.concat([realJpeg, Buffer.from([0x00])]),
    badLength,
    emptyScan,
    Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9])
  ];

  for (const bytes of invalidJpegs) {
    assert.throws(
      () => validateImageInput({
        imageBase64: bytes.toString("base64"),
        mediaType: "image/jpeg"
      }),
      (error) => error instanceof ClientError && error.message === ERROR_MESSAGES.invalidImage
    );
  }
});

test("rejects an image over the byte limit before analysis", () => {
  assert.throws(
    () => validateImageInput(
      { imageBase64: tinyJpegBase64, mediaType: "image/jpeg" },
      774
    ),
    (error) => error instanceof ClientError &&
      error.status === 413 &&
      error.message === ERROR_MESSAGES.imageTooLarge
  );
});
