import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createMemoryVistaFirestore } from "../test-support/memory-vista-firestore.js";
import { recordInput } from "../test-support/vista-record-input.js";

const path = `vistaInspectionPackageOwners/${recordInput.ownerKey}/runs/${recordInput.runId}`;
const makeStore = (harness) => createVistaPackageRecordStore({
  firestore: harness.firestore, receiptId: () => "594bcc69-8f09-4dce-a98a-bba5de7ef0c2",
  clock: () => new Date("2026-08-10T22:30:59Z"),
  serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1"
});

test("transactionally creates one receiving reservation", async () => {
  const harness = createMemoryVistaFirestore();
  const result = await makeStore(harness).reserve(recordInput);
  assert.equal(result.kind, "reserved");
  const record = harness.documents.get(path);
  assert.equal(record.status, "receiving");
  assert.equal(record.receiptId, result.receiptId);
  assert.equal(record.runId, recordInput.runId);
});

test("same manifest resumes while a different manifest conflicts", async () => {
  const harness = createMemoryVistaFirestore();
  const store = makeStore(harness);
  const first = await store.reserve(recordInput);
  const second = await store.reserve(recordInput);
  assert.deepEqual(second, { kind: "resumed", receiptId: first.receiptId });
  await assert.rejects(store.reserve({ ...recordInput, manifestSha256: "a".repeat(64) }),
    (error) => error.code === "run_manifest_conflict");
});
