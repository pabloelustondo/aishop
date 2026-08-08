import assert from "node:assert/strict";
import test from "node:test";
import {
  ClientError, ERROR_MESSAGES, InspectionOperationError, ProviderError
} from "../src/errors.js";
import { createInspectionAPIHandler } from "../src/inspection-api-handler.js";

function responseResult() {
  const result = {};
  return { result, response: {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  } };
}

function handler(error) {
  return createInspectionAPIHandler({
    clientToken: "client-token",
    submitInspection: async () => { throw error; },
    evidenceReader: {}, verifyIdToken: async () => ({}),
    logger: { error() {} }
  });
}

const cases = [
  [new ClientError(400, ERROR_MESSAGES.invalidImage), 400, "invalidImage"],
  [new InspectionOperationError("evidence"), 503, "evidenceFailed"],
  [new ProviderError("timeout"), 502, "analysisFailed"],
  [new InspectionOperationError("record"), 503, "recordFailed"],
  [new Error("secret internals"), 500, "operationFailed"]
];

test("returns safe, stage-specific inspection failures", async (context) => {
  for (const [error, status, messageKey] of cases) await context.test(messageKey, async () => {
    const { result, response } = responseResult();
    await handler(error)({
      method: "POST", url: "/inspections",
      headers: { authorization: "Bearer client-token", "content-type": "application/json" },
      rawBody: Buffer.from("{}")
    }, response);
    assert.equal(result.status, status);
    assert.deepEqual(result.body, { error: ERROR_MESSAGES[messageKey] });
    assert.doesNotMatch(result.body.error, /secret internals/);
  });
});
