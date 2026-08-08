import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ERROR_MESSAGES } from "../src/errors.js";
import { validateImageInput } from "../src/image-input.js";

function fixture(name) {
  return readFileSync(new URL(`../test-fixtures/${name}`, import.meta.url), "utf8")
    .replace(/\s+/g, "");
}

const canonical = fixture("tiny.jpg.base64");
const gainMap = fixture("iphone-gain-map.jpg.base64");

test("accepts a canonical base64 JPEG", () => {
  const input = { imageBase64: canonical, mediaType: "image/jpeg" };
  assert.deepEqual(validateImageInput(input), input);
});

test("accepts a standards-compliant iPhone-style gain-map JPEG", () => {
  const input = { imageBase64: gainMap, mediaType: "image/jpeg" };
  assert.deepEqual(validateImageInput(input), input);
  assert.equal(Buffer.from(gainMap, "base64").length, 2633);
});

test("rejects an image over the byte limit before analysis", () => {
  assert.throws(
    () => validateImageInput(
      { imageBase64: canonical, mediaType: "image/jpeg" }, 774
    ),
    (error) => error.status === 413 && error.message === ERROR_MESSAGES.imageTooLarge
  );
});
