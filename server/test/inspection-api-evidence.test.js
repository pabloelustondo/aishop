import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionAPIHandler } from "../src/inspection-api-handler.js";

function responseResult() {
  const result = {};
  return { result, response: {
    writeHead(status, headers) {
      result.status = status;
      result.headers = headers;
    },
    end(body) { result.body = body; }
  } };
}

function handler(verifyIdToken) {
  return createInspectionAPIHandler({
    clientToken: "client-token",
    submitInspection: async () => ({}),
    verifyIdToken,
    evidenceReader: { readOriginal: async () => ({
      bytes: Buffer.from("original"), mediaType: "image/jpeg"
    }) },
    logger: { error() {} }
  });
}

const request = {
  method: "GET",
  url: "/inspections/00000000-0000-4000-8000-000000000001/evidence",
  headers: { authorization: "Bearer reviewer-token" }
};

test("returns private original bytes only to a claimed reviewer", async () => {
  const { result, response } = responseResult();
  await handler(async () => ({ uid: "reviewer-1", reviewer: true }))(request, response);

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, Buffer.from("original"));
  assert.equal(result.headers["Cache-Control"], "private, no-store");
  assert.equal(result.headers["Content-Type"], "image/jpeg");
});

test("denies a valid identity without the reviewer claim", async () => {
  const { result, response } = responseResult();
  await handler(async () => ({ uid: "user-1" }))(request, response);

  assert.equal(result.status, 401);
  assert.deepEqual(JSON.parse(result.body), { error: "Unauthorized." });
});
