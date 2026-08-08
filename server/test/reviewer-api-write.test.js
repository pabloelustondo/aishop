import assert from "node:assert/strict";
import test from "node:test";
import { createReviewerAPIHandler } from "../src/reviewer-api-handler.js";

const scanId = "00000000-0000-4000-8000-000000000001";
test("records a disposition with verified identity and server-owned time", async () => {
  let stored;
  const handler = createReviewerAPIHandler({
    verifyIdToken: async () => ({ uid: "reviewer-1", reviewer: true }),
    recordReader: { getDetail: async () => ({ scanId }) },
    recordStore: { appendReview: async (id, review) => {
      stored = { id, review };
      return { ...review, reviewedAt: "server-time" };
    } },
    logger: { error() {} }
  });
  const result = {};
  await handler({
    method: "POST",
    url: `/inspections/${scanId}/reviews`,
    headers: { authorization: "Bearer token" },
    rawBody: Buffer.from(JSON.stringify({
      disposition: "corrected", notes: " Wrong product "
    }))
  }, {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  });

  assert.equal(result.status, 201);
  assert.deepEqual(stored, {
    id: scanId,
    review: {
      disposition: "corrected",
      notes: "Wrong product",
      reviewerId: "reviewer-1"
    }
  });
  assert.equal(result.body.review.reviewedAt, "server-time");
  assert.equal(Object.hasOwn(stored.review, "initialFindings"), false);
});
