import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const configuration = () => JSON.parse(readFileSync(
  new URL("../../storage.cors.json", import.meta.url)));

test("video resumable upload CORS is limited to TEST and local origins", () => {
  const [rule] = configuration();
  assert.deepEqual(rule.origin, [
    "https://aishop-99d36.web.app",
    "https://aishop-99d36.firebaseapp.com",
    "http://127.0.0.1:5000",
    "http://localhost:5000"
  ]);
  assert.deepEqual(rule.method, ["PUT"]);
  assert.deepEqual(new Set(rule.responseHeader), new Set([
    "Content-Type", "Content-Range", "Range", "x-goog-resumable"
  ]));
  assert.ok(rule.maxAgeSeconds <= 3600);
});
