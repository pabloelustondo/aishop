import assert from "node:assert/strict";
import test from "node:test";
import { createAgentDueWorkReader } from "../src/agent-due-work-reader.js";

const OWNER = "e".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const RUN = "56fe7ad1-7a4f-4ba8-86a6-04cfd701de2b";
const NOW = new Date("2026-09-13T15:00:30.000Z");
const DUE = new Date("2026-09-13T15:00:15.000Z");

function harness(docs = []) {
  const calls = [];
  const query = {
    where: (...args) => { calls.push(["where", ...args]); return query; },
    orderBy: (...args) => { calls.push(["orderBy", ...args]); return query; },
    limit: value => { calls.push(["limit", value]); return query; },
    get: async () => ({ docs })
  };
  return { calls, reader: createAgentDueWorkReader({
    firestore: { collectionGroup: name => { calls.push(["collectionGroup", name]);
      return query; } }, clock: () => NOW
  }) };
}

function document({ ownerKey = OWNER, id = ID, runId = RUN,
  providerRunId = runId, leaseUntil = null } = {}) {
  return { id, ref: { parent: { parent: { id: ownerKey } } },
    data: () => ({ status: "analyzing", providerRunId,
      collectionDueAt: DUE, collectionLeaseUntil: leaseUntil,
      runs: [{ runId }] }) };
}

test("queries only due analyzing work in oldest-first order", async () => {
  const { calls, reader } = harness([document()]);
  assert.deepEqual(await reader.list(), [{ ownerKey: OWNER, analysisId: ID,
    runId: RUN, dueAt: DUE }]);
  assert.deepEqual(calls, [
    ["collectionGroup", "analyses"],
    ["where", "status", "==", "analyzing"],
    ["where", "collectionDueAt", "<=", NOW],
    ["orderBy", "collectionDueAt", "asc"],
    ["limit", 50]
  ]);
});

test("drops malformed and stale records rather than dispatching them", async () => {
  const { reader } = harness([document({ ownerKey: "bad" }),
    document({ runId: "0d07fbdb-689f-4b44-aa95-9c4e08cfc665",
      providerRunId: RUN }), document({ leaseUntil: new Date(NOW.getTime() + 1) }),
    document()]);
  assert.equal((await reader.list()).length, 1);
});

test("requires a bounded limit and valid clock", async () => {
  const { reader } = harness();
  await assert.rejects(reader.list({ limit: 101 }), TypeError);
  const broken = createAgentDueWorkReader({ firestore: {
    collectionGroup: () => { throw new Error("should not query"); }
  }, clock: () => "now" });
  await assert.rejects(broken.list(), TypeError);
});
