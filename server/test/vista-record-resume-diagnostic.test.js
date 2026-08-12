import assert from "node:assert/strict";
import test from "node:test";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createMemoryVistaFirestore } from "../test-support/memory-vista-firestore.js";
import { recordInput } from "../test-support/vista-record-input.js";

const path = `vistaInspectionPackageOwners/${recordInput.ownerKey}/runs/${recordInput.runId}`;

test("emits one bounded diagnostic after a receiving reservation resumes", async () => {
  const harness = createMemoryVistaFirestore();
  const events = [];
  const store = createVistaPackageRecordStore({ firestore: harness.firestore,
    receiptId: () => "private-receipt-id", clock: () => new Date(),
    serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1",
    emitDiagnostic: (event) => {
      assert.equal(harness.documents.get(path).status, "receiving");
      events.push(event);
    } });
  assert.equal((await store.reserve(recordInput)).kind, "reserved");
  assert.deepEqual(events, []);
  assert.equal((await store.reserve(recordInput)).kind, "resumed");
  assert.deepEqual(events, [{ schemaVersion: 1,
    event: "vista.package.receiving_resumed", state: "receiving" }]);
  assert.doesNotMatch(JSON.stringify(events), new RegExp(
    `${recordInput.ownerKey}|${recordInput.runId}|private`, "i"));
});
