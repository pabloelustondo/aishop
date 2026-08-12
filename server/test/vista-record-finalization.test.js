import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createMemoryVistaFirestore } from "../test-support/memory-vista-firestore.js";
import { expectedReceipt, recordInput } from "../test-support/vista-record-input.js";

function makeStore(harness) {
  const times = ["2026-08-10T22:30:59Z", "2026-08-10T22:31:00Z"];
  return createVistaPackageRecordStore({ firestore: harness.firestore,
    receiptId: () => expectedReceipt.receiptId,
    clock: () => new Date(times.shift() ?? "2026-08-10T22:31:00Z"),
    serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1" });
}

test("finalizes one immutable golden receipt and later observes it", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  await store.reserve(recordInput);
  const first = await store.finalize(recordInput);
  assert.equal(first.kind, "finalized");
  assert.deepEqual(first.receipt, expectedReceipt);
  const observed = await store.reserve(recordInput);
  assert.deepEqual(observed, { kind: "received", receipt: expectedReceipt });
});

test("a finalization failure leaves receiving and retry completes", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  await store.reserve(recordInput);
  harness.failNextUpdate();
  await assert.rejects(store.finalize(recordInput),
    (error) => error.code === "evidence_persistence_unavailable");
  assert.equal((await store.reserve(recordInput)).kind, "resumed");
  assert.equal((await store.finalize(recordInput)).kind, "finalized");
});
