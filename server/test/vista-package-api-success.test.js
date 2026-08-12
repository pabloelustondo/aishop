import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { responseResult } from "../test-support/response-result.js";
import { createVistaAPIHarness } from "../test-support/vista-api-harness.js";
import { request } from "../test-support/vista-package-fixture.js";

const receiptURL = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/receipt.json",
  import.meta.url
);
const expected = JSON.parse(readFileSync(receiptURL));
const authenticatedRequest = () => request(undefined,
  { authorization: "Bearer valid-fixture-token" });

test("returns the golden 201 receipt after durable package persistence", async () => {
  const harness = createVistaAPIHarness({ receiptId: () => expected.receiptId });
  const first = responseResult();
  await harness.handler(authenticatedRequest(), first.response);
  assert.equal(first.result.status, 201);
  assert.deepEqual(first.result.body, expected);
  assert.equal(first.result.headers["Cache-Control"], "no-store");
  assert.match(first.result.headers["Content-Type"], /^application\/json/);
  assert.equal(harness.bucket.objects.size, 3);
  assert.equal(harness.database.documents.size, 1);
});

test("an identical retry returns 200 with the immutable receipt", async () => {
  const harness = createVistaAPIHarness({ receiptId: () => expected.receiptId });
  const first = responseResult();
  const retry = responseResult();
  await harness.handler(authenticatedRequest(), first.response);
  await harness.handler(authenticatedRequest(), retry.response);
  assert.equal(first.result.status, 201);
  assert.equal(retry.result.status, 200);
  assert.deepEqual(retry.result.body, first.result.body);
});
