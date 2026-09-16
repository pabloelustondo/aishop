import assert from "node:assert/strict";
import test from "node:test";
import { createAgentVideoTaskEnqueuer, readVideoTaskPayload } from "../src/agent-video-task-enqueuer.js";

const input = { ownerKey: "a".repeat(64), analysisId: "video-analysis",
  attemptId: "attempt-current" };

test("enqueues an idempotently named private video task", async () => {
  const calls = [];
  const enqueuer = createAgentVideoTaskEnqueuer({ queue: { enqueue: async (...args) => calls.push(args) } });
  const result = await enqueuer.enqueue(input);
  assert.equal(result.enqueued, true);
  assert.match(result.taskId, /^video-[a-f0-9]{48}$/);
  assert.equal(result.taskName, result.taskId);
  assert.deepEqual(calls[0][0], input);
  assert.equal(calls[0][1].dispatchDeadlineSeconds, 540);
});

test("different attempts receive different task identities", async () => {
  const queue = { enqueue: async () => {} };
  const enqueuer = createAgentVideoTaskEnqueuer({ queue });
  const first = await enqueuer.enqueue(input);
  const second = await enqueuer.enqueue({ ...input, attemptId: "attempt-next" });
  assert.notEqual(first.taskName, second.taskName);
});

test("deletes a queued task by its returned identity", async () => {
  const calls = [];
  const enqueuer = createAgentVideoTaskEnqueuer({ queue: {
    enqueue: async () => {}, delete: async value => calls.push(value)
  } });
  const { taskName } = await enqueuer.enqueue(input);
  assert.deepEqual(await enqueuer.delete(taskName), { deleted: true });
  assert.deepEqual(calls, [taskName]);
});

test("duplicate task creation is successful idempotency", async () => {
  const enqueuer = createAgentVideoTaskEnqueuer({ queue: { enqueue: async () => {
    throw Object.assign(new Error("duplicate"), { code: 6 });
  } } });
  assert.equal((await enqueuer.enqueue(input)).duplicate, true);
});

test("the private task accepts only its fixed payload", () => {
  assert.deepEqual(readVideoTaskPayload(input), input);
  for (const bad of [{ ...input, uri: "secret" }, { analysisId: input.analysisId }, null]) {
    assert.throws(() => readVideoTaskPayload(bad), TypeError);
  }
});
