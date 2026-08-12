import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createMemoryVistaFirestore } from "../test-support/memory-vista-firestore.js";
import { recordInput } from "../test-support/vista-record-input.js";

test("finalization refuses manifest-bound input that differs from reservation", async () => {
  const harness = createMemoryVistaFirestore();
  const store = createVistaPackageRecordStore({ firestore: harness.firestore,
    receiptId: () => "00000000-0000-4000-8000-000000000001",
    clock: () => new Date("2026-08-10T22:31:00Z"),
    serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1" });
  await store.reserve(recordInput);
  await assert.rejects(store.finalize({ ...recordInput,
    receiptRunId: "00000000-0000-4000-8000-000000000002",
    artifactSha256: ["b".repeat(64)] }),
  (error) => error.code === "evidence_persistence_unavailable");
  assert.equal([...harness.documents.values()][0].status, "receiving");
});
