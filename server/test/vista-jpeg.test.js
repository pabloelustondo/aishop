import assert from "node:assert/strict";
import test from "node:test";
import { inspectVistaJpeg } from "../src/vista-jpeg.js";
import { fixture } from "../test-support/vista-package-fixture.js";

test("reads the dimensions of exactly one vendored JPEG", () => {
  assert.deepEqual(inspectVistaJpeg(fixture.jpeg), { width: 2, height: 2 });
});

test("rejects truncated and concatenated JPEGs", () => {
  assert.equal(inspectVistaJpeg(fixture.jpeg.subarray(0, -1)), null);
  assert.equal(inspectVistaJpeg(Buffer.concat([fixture.jpeg, fixture.jpeg])), null);
});

test("rejects marker-plausible JPEG bytes without referenced decode tables", () => {
  const bytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01,
    0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00,
    0x00, 0x3f, 0x00, 0x01, 0xff, 0xd9
  ]);
  assert.equal(inspectVistaJpeg(bytes), null);
});
