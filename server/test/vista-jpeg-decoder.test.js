import assert from "node:assert/strict";
import test from "node:test";
import { decodeVistaJpeg } from "../src/vista-jpeg-decoder.js";
import { fixture } from "../test-support/vista-package-fixture.js";
import {
  impossibleHuffmanJpeg, insufficientEntropyJpeg
} from "../test-support/vista-invalid-jpegs.js";

const limits = { jpegAxis: 4_096, jpegPixels: 16_777_216 };

test("fully decodes the vendored JPEG without changing submitted bytes", async () => {
  const expected = Buffer.from(fixture.jpeg);
  assert.deepEqual(await decodeVistaJpeg(fixture.jpeg, limits),
    { width: 2, height: 2 });
  assert.deepEqual(fixture.jpeg, expected);
});

test("rejects impossible Huffman and insufficient entropy JPEGs", async () => {
  for (const bytes of [impossibleHuffmanJpeg(), insufficientEntropyJpeg()]) {
    await assert.rejects(decodeVistaJpeg(bytes, limits),
      (error) => error.code === "invalid_jpeg");
  }
});

test("maps truncated and concatenated JPEGs to invalid_jpeg", async () => {
  const invalid = [fixture.jpeg.subarray(0, -1),
    Buffer.concat([fixture.jpeg, fixture.jpeg])];
  for (const bytes of invalid) {
    await assert.rejects(decodeVistaJpeg(bytes, limits),
      (error) => error.code === "invalid_jpeg");
  }
});

test("enforces independent axis and decoded-pixel limits", async () => {
  await assert.rejects(decodeVistaJpeg(fixture.jpeg,
    { ...limits, jpegAxis: 1 }), (error) => error.code === "invalid_jpeg");
  await assert.rejects(decodeVistaJpeg(fixture.jpeg,
    { ...limits, jpegPixels: 3 }), (error) => error.code === "invalid_jpeg");
  assert.deepEqual(await decodeVistaJpeg(fixture.jpeg,
    { jpegAxis: 2, jpegPixels: 4 }), { width: 2, height: 2 });
});
