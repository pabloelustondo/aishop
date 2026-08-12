import assert from "node:assert/strict";
import test from "node:test";
import { createReviewerAPIHandler } from "../src/reviewer-api-handler.js";

function responseResult() {
  const result = {};
  return { result, response: {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  } };
}

const scanId = "00000000-0000-4000-8000-000000000001";
function handler(verifyIdToken) {
  return createReviewerAPIHandler({
    verifyIdToken,
    recordReader: {
      getDetail: async (id) => ({ scanId: id, ownerId: "customer-1", initialFindings: {} })
    },
    recordStore: {}, logger: { error() {} }
  });
}

test("a customer reads their own inspection detail", async () => {
  const { result, response } = responseResult();
  await handler(async () => ({ uid: "customer-1" }))({
    method: "GET", url: `/inspections/${scanId}`,
    headers: { authorization: "Bearer token" }
  }, response);
  assert.equal(result.status, 200);
  assert.equal(result.body.scanId, scanId);
});

test("a customer cannot read another customer's inspection", async () => {
  const { result, response } = responseResult();
  await handler(async () => ({ uid: "customer-2" }))({
    method: "GET", url: `/inspections/${scanId}`,
    headers: { authorization: "Bearer token" }
  }, response);
  assert.equal(result.status, 404);
});
