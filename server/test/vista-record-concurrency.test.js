import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createMemoryVistaFirestore } from "../test-support/memory-vista-firestore.js";
import { recordInput } from "../test-support/vista-record-input.js";

function makeStore(harness) {
  let next = 0;
  return createVistaPackageRecordStore({ firestore: harness.firestore,
    receiptId: () => `00000000-0000-4000-8000-${String(++next).padStart(12, "0")}`,
    clock: () => new Date("2026-08-10T22:31:00Z"),
    serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1" });
}

test("concurrent identical reservations and finalizations converge", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  const reservations = await Promise.all([
    store.reserve(recordInput), store.reserve(recordInput)
  ]);
  assert.deepEqual(reservations.map(({ kind }) => kind), ["reserved", "resumed"]);
  const finalized = await Promise.all([
    store.finalize(recordInput), store.finalize(recordInput)
  ]);
  assert.deepEqual(finalized.map(({ kind }) => kind), ["finalized", "received"]);
  assert.deepEqual(finalized[0].receipt, finalized[1].receipt);
});

test("concurrent conflicting manifests admit one reservation", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  const conflict = { ...recordInput, manifestSha256: "a".repeat(64) };
  const results = await Promise.allSettled([
    store.reserve(recordInput), store.reserve(conflict)
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].reason.code, "run_manifest_conflict");
  assert.equal(harness.documents.size, 1);
});

test("the same run remains isolated across owner keys", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  await Promise.all([store.reserve(recordInput), store.reserve({ ...recordInput,
    ownerKey: "b".repeat(64) })]);
  assert.equal(harness.documents.size, 2);
});
