import assert from "node:assert/strict";
import test from "node:test";
import { ERROR_MESSAGES } from "../src/errors.js";
import { createReviewerAPIHandler } from "../src/reviewer-api-handler.js";

test("returns a safe review failure without exposing internals", async () => {
  const handler = createReviewerAPIHandler({
    verifyIdToken: async () => ({ uid: "reviewer-1", reviewer: true }),
    recordReader: {
      listForReview: async () => { throw new Error("database internals"); }
    },
    recordStore: {}, logger: { error() {} }
  });
  const result = {};
  await handler({
    method: "GET", url: "/inspections",
    headers: { authorization: "Bearer token" }
  }, {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.reviewFailed });
  assert.doesNotMatch(result.body.error, /database internals/);
});
