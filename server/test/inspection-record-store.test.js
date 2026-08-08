import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionRecordStore } from "../src/inspection-record-store.js";

function harness(existing = { reviewCount: 0 }) {
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

test("creates immutable initial findings as a pending record", async () => {
  const { store, calls } = harness();
  const findings = { summary: "Original AI output" };
  await store.createInitial({ scanId: "scan-1", initialFindings: findings });
  findings.summary = "mutated later";

  assert.equal(calls[0][1].status, "pending");
  assert.equal(calls[0][1].createdAt, "server-time");
  assert.equal(calls[0][1].initialFindings.summary, "Original AI output");
});

test("appends review separately without overwriting initial findings", async () => {
  const { store, calls } = harness({ reviewCount: 2 });
  await store.appendReview("scan-1", {
    disposition: "corrected", reviewerId: "reviewer-1", notes: "Wrong brand"
  });

  const update = calls.find(([kind]) => kind === "update")[2];
  const event = calls.find(([kind]) => kind === "review")[2];
  assert.deepEqual(update, {
    status: "corrected", latestReviewAt: "server-time", reviewCount: 3
  });
  assert.equal(Object.hasOwn(update, "initialFindings"), false);
  assert.equal(event.reviewerId, "reviewer-1");
});
