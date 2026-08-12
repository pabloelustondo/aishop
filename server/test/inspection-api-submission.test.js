import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionAPIHandler } from "../src/inspection-api-handler.js";

function responseResult() {
  const result = {};
  return { result, response: {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  } };
}

function handler({ verifyIdToken, submitInspection }) {
  return createInspectionAPIHandler({
    submitInspection, evidenceReader: {}, verifyIdToken, logger: { error() {} }
  });
}

const request = {
  method: "POST", url: "/inspections",
  headers: { authorization: "Bearer customer-token", "content-type": "application/json" },
  rawBody: Buffer.from("{}")
};

test("submits with the verified customer's ownerId", async () => {
  const { result, response } = responseResult();
  let receivedOwnerId;
  await handler({
    verifyIdToken: async () => ({ uid: "customer-1" }),
    submitInspection: async (_body, ownerId) => {
      receivedOwnerId = ownerId;
      return { scanId: "scan-1" };
    }
  })(request, response);
  assert.equal(result.status, 201);
  assert.equal(receivedOwnerId, "customer-1");
});

test("denies submission without a verified identity", async () => {
  const { result, response } = responseResult();
  let called = false;
  await handler({
    verifyIdToken: async () => { throw new Error("invalid"); },
    submitInspection: async () => { called = true; }
  })(request, response);
  assert.equal(result.status, 401);
  assert.equal(called, false);
});
