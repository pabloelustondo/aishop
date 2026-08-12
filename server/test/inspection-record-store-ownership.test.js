import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionRecordStore } from "../src/inspection-record-store.js";

function harness(existing) {
  const calls = [];
  const reviewRef = {};
  const ref = {
    create: async (data) => calls.push(["create", data]),
    collection: () => ({ doc: () => reviewRef })
  };
  const firestore = {
    collection: () => ({ doc: () => ref }),
    runTransaction: async (work) => work({
      get: async () => ({ exists: true, data: () => existing }),
      create: (...args) => calls.push(["review", ...args]),
      update: (...args) => calls.push(["update", ...args])
    })
  };
  return { store: createInspectionRecordStore({
    firestore,
    serverTimestamp: () => "server-time"
  }), calls };
}

test("persists ownerId on the initial record", async () => {
  const { store, calls } = harness();
  await store.createInitial({
    scanId: "scan-1", ownerId: "customer-1", initialFindings: { summary: "AI" }
  });
  assert.equal(calls[0][1].ownerId, "customer-1");
});

test("persists ownerId on a failure record", async () => {
  const { store, calls } = harness();
  await store.createFailure({ scanId: "scan-1", ownerId: "customer-1" });
  assert.equal(calls[0][1].ownerId, "customer-1");
});

test("does not overwrite ownerId when a review is appended", async () => {
  const { store, calls } = harness({ ownerId: "customer-1", reviewCount: 0 });
  await store.appendReview("scan-1", { disposition: "verified", reviewerId: "reviewer-1" });
  const update = calls.find(([kind]) => kind === "update")[2];
  assert.equal(Object.hasOwn(update, "ownerId"), false);
});
