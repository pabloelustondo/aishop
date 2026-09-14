import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_COLLECTION_FUNCTION, AGENT_TASK_DISPATCH_DEADLINE_SECONDS,
  createAgentTaskEnqueuer } from "../src/agent-task-enqueuer.js";

const OWNER = "e".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const RUN = "56fe7ad1-7a4f-4ba8-86a6-04cfd701de2b";
const DUE = new Date("2026-09-13T15:00:15.000Z");

test("targets the Montréal collector supported by Cloud Tasks", () => {
  assert.equal(AGENT_COLLECTION_FUNCTION,
    "locations/northamerica-northeast1/functions/collectAgentAnalysis");
});

function harness(enqueue = async () => {}) {
  const calls = [];
  return { calls, enqueuer: createAgentTaskEnqueuer({ queue: {
    enqueue: async (...args) => { calls.push(args); return enqueue(...args); }
  } }) };
}

test("enqueues only the fixed private payload at the persisted due time", async () => {
  const { calls, enqueuer } = harness();
  const result = await enqueuer.enqueue({ ownerKey: OWNER, analysisId: ID,
    runId: RUN, dueAt: DUE, ignored: "never serialized" });

  assert.deepEqual(calls[0][0], { ownerKey: OWNER, analysisId: ID, runId: RUN });
  assert.deepEqual(calls[0][1].scheduleTime, DUE);
  assert.equal(calls[0][1].dispatchDeadlineSeconds,
    AGENT_TASK_DISPATCH_DEADLINE_SECONDS);
  assert.match(calls[0][1].id, /^agent-[0-9a-f]{48}$/);
  assert.equal(result.enqueued, true);
});

test("the same due work receives the same task id", async () => {
  const { calls, enqueuer } = harness();
  const input = { ownerKey: OWNER, analysisId: ID, runId: RUN, dueAt: DUE };
  await enqueuer.enqueue(input);
  await enqueuer.enqueue(input);
  assert.equal(calls[0][1].id, calls[1][1].id);
});

test("an existing task is an idempotent success", async () => {
  const { enqueuer } = harness(async () => {
    throw Object.assign(new Error("exists"), { code: "functions/task-already-exists" });
  });
  const result = await enqueuer.enqueue({ ownerKey: OWNER, analysisId: ID,
    runId: RUN, dueAt: DUE });
  assert.deepEqual({ enqueued: result.enqueued, duplicate: result.duplicate },
    { enqueued: false, duplicate: true });
});

test("rejects malformed identity or scheduling fields before queue access", async () => {
  const { calls, enqueuer } = harness();
  await assert.rejects(enqueuer.enqueue({ ownerKey: "bad", analysisId: ID,
    runId: RUN, dueAt: DUE }), TypeError);
  await assert.rejects(enqueuer.enqueue({ ownerKey: OWNER, analysisId: ID,
    runId: "bad", dueAt: DUE }), TypeError);
  await assert.rejects(enqueuer.enqueue({ ownerKey: OWNER, analysisId: ID,
    runId: RUN, dueAt: "tomorrow" }), TypeError);
  assert.equal(calls.length, 0);
});

test("does not hide a real queue failure", async () => {
  const failure = new Error("queue unavailable");
  const { enqueuer } = harness(async () => { throw failure; });
  await assert.rejects(enqueuer.enqueue({ ownerKey: OWNER, analysisId: ID,
    runId: RUN, dueAt: DUE }), error => error === failure);
});
