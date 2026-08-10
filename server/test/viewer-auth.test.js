import assert from "node:assert/strict";
import test from "node:test";
import { readDetailForViewer } from "../src/viewer-auth.js";

function reader(record) {
  return { getDetail: async () => record };
}

test("a reviewer sees any record", async () => {
  const detail = await readDetailForViewer({
    recordReader: reader({ scanId: "s1", ownerId: "customer-1" }),
    scanId: "s1", authorization: "Bearer token",
    verifyIdToken: async () => ({ uid: "reviewer-1", reviewer: true })
  });
  assert.equal(detail.scanId, "s1");
});

test("a customer sees their own record", async () => {
  const detail = await readDetailForViewer({
    recordReader: reader({ scanId: "s1", ownerId: "customer-1" }),
    scanId: "s1", authorization: "Bearer token",
    verifyIdToken: async () => ({ uid: "customer-1" })
  });
  assert.equal(detail.scanId, "s1");
});

test("a customer cannot see another customer's record", async () => {
  const detail = await readDetailForViewer({
    recordReader: reader({ scanId: "s1", ownerId: "customer-1" }),
    scanId: "s1", authorization: "Bearer token",
    verifyIdToken: async () => ({ uid: "customer-2" })
  });
  assert.equal(detail, null);
});

test("rejects a request with no verified identity", async () => {
  await assert.rejects(readDetailForViewer({
    recordReader: reader({ scanId: "s1", ownerId: "customer-1" }),
    scanId: "s1", authorization: undefined,
    verifyIdToken: async () => ({ uid: "customer-1" })
  }));
});
