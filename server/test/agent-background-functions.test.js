import assert from "node:assert/strict";
import test from "node:test";
import { createAgentCollectionTaskHandler, createAgentReconciler,
  readCollectionTaskPayload } from "../src/agent-background-functions.js";

const INPUT = { ownerKey: "e".repeat(64), analysisId: "analysis_1",
  runId: "56fe7ad1-7a4f-4ba8-86a6-04cfd701de2b" };
const DUE = new Date("2026-09-13T15:00:15.000Z");

test("private task handler accepts exactly the fixed payload", async () => {
  let received;
  const handler = createAgentCollectionTaskHandler({ collector: {
    collect: async input => { received = input; }
  } });
  await handler({ data: INPUT });
  assert.deepEqual(received, INPUT);
  for (const value of [null, [], { ...INPUT, extra: true },
    { ownerKey: INPUT.ownerKey, analysisId: INPUT.analysisId }]) {
    assert.throws(() => readCollectionTaskPayload(value), TypeError);
  }
});

test("reconciler dispatches every overdue record with its persisted due time", async () => {
  const dispatched = [];
  const work = [{ ...INPUT, dueAt: DUE }, { ...INPUT,
    analysisId: "analysis_2", dueAt: DUE }];
  const reconcile = createAgentReconciler({
    dueWorkReader: { list: async () => work },
    taskEnqueuer: { enqueue: async input => dispatched.push(input) }
  });
  assert.deepEqual(await reconcile(), { scanned: 2, dispatched: 2 });
  assert.deepEqual(dispatched, work);
});

test("reconciler attempts all work and fails for scheduler retry when any dispatch fails", async () => {
  const attempted = [];
  const work = [{ ...INPUT, dueAt: DUE }, { ...INPUT,
    analysisId: "analysis_2", dueAt: DUE }];
  const reconcile = createAgentReconciler({ dueWorkReader: { list: async () => work },
    taskEnqueuer: { enqueue: async input => { attempted.push(input.analysisId);
      if (input.analysisId === "analysis_1") throw new Error("queue down"); } } });
  await assert.rejects(reconcile(), AggregateError);
  assert.deepEqual(attempted, ["analysis_1", "analysis_2"]);
});
