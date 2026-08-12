import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionAPIHandler } from "../src/inspection-api-handler.js";

test("the old shared client token no longer authorizes a submission", async () => {
  const result = {};
  let submitted = false;
  const handler = createInspectionAPIHandler({
    submitInspection: async () => { submitted = true; return {}; },
    evidenceReader: {},
    verifyIdToken: async () => { throw new Error("not a Firebase ID token"); },
    logger: { error() {} }
  });
  await handler({
    method: "POST", url: "/inspections",
    headers: {
      authorization: "Bearer the-old-static-client-token",
      "content-type": "application/json"
    },
    rawBody: Buffer.from("{}")
  }, {
    writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); }
  });
  assert.equal(result.status, 401);
  assert.equal(submitted, false);
});
