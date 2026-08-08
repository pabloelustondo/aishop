import assert from "node:assert/strict";
import test from "node:test";
import { createInspectionRecordReader } from "../src/inspection-record-reader.js";

function snapshot(id, data) {
  return { id, exists: true, data: () => data };
}

test("returns pending, recent, detail, and append-only review history", async () => {
  const initialFindings = { summary: "Original" };
  const pending = { docs: [snapshot("scan-1", { status: "pending" })] };
  const recent = { docs: [snapshot("scan-2", { status: "verified" })] };
  const reviews = { docs: [snapshot("review-1", { disposition: "verified" })] };
  const ordered = (result) => ({
    limit: () => ({ get: async () => result }),
    get: async () => result
  });
  const ref = {
    get: async () => snapshot("scan-1", { initialFindings }),
    collection: () => ({ orderBy: () => ordered(reviews) })
  };
  const scans = {
    where: () => ({ orderBy: () => ordered(pending) }),
    orderBy: () => ordered(recent),
    doc: () => ref
  };
  const reader = createInspectionRecordReader({
    firestore: { collection: () => scans }
  });

  const lists = await reader.listForReview();
  const detail = await reader.getDetail("scan-1");
  assert.equal(lists.pending[0].scanId, "scan-1");
  assert.equal(lists.recent[0].status, "verified");
  assert.deepEqual(detail.initialFindings, initialFindings);
  assert.equal(detail.reviews[0].scanId, "review-1");
});

test("returns null for a missing inspection", async () => {
  const ref = {
    get: async () => ({ exists: false }),
    collection: () => ({ orderBy: () => ({ get: async () => ({ docs: [] }) }) })
  };
  const reader = createInspectionRecordReader({
    firestore: { collection: () => ({ doc: () => ref }) }
  });
  assert.equal(await reader.getDetail("missing"), null);
});
