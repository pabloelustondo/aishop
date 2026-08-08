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
function handler() {
  return createReviewerAPIHandler({
    verifyIdToken: async () => ({ uid: "reviewer-1", reviewer: true }),
    recordReader: {
      listForReview: async () => ({ pending: [{ scanId }], recent: [] }),
      getDetail: async (id) => ({ scanId: id, initialFindings: { summary: "AI" } })
    },
    recordStore: {},
    logger: { error() {} }
  });
}

test("lists pending and recent inspections for a reviewer", async () => {
  const { result, response } = responseResult();
  await handler()({
    method: "GET", url: "/inspections",
    headers: { authorization: "Bearer token" }
  }, response);
  assert.equal(result.status, 200);
  assert.equal(result.body.pending[0].scanId, scanId);
});

test("returns inspection detail without changing initial findings", async () => {
  const { result, response } = responseResult();
  await handler()({
    method: "GET", url: `/inspections/${scanId}`,
    headers: { authorization: "Bearer token" }
  }, response);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.initialFindings, { summary: "AI" });
});
