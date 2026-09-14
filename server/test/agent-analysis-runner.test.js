import assert from "node:assert/strict";
import test from "node:test";
import { ProviderError } from "../src/errors.js";
import { createAgentAnalysisRunner, createRunMemorySampler }
  from "../src/agent-analysis-runner.js";
import { AgentEvidenceUnavailableError } from "../src/agent-evidence-store.js";

const OWNER = "e".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const RUN = "56fe7ad1-7a4f-4ba8-86a6-04cfd701de2b";
const DUE = new Date("2026-09-13T15:00:15.000Z");
const BYTES = Buffer.from([0xff, 0xd8, 7, 7, 0xff, 0xd9]);

function harness({ start, readSource, enqueue, markProviderStarted } = {}) {
  const calls = [];
  const analysisStore = {
    markAnalyzing: async input => { calls.push(["analyzing", input]);
      return { runId: RUN, runNumber: 1, trigger: "initial" }; },
    markProviderStarted: markProviderStarted ?? (async input => {
      calls.push(["provider-id", input]); return { runId: RUN,
        responseId: "resp_123", dueAt: DUE }; }),
    markFailed: async input => { calls.push(["failed", input]); },
    read: async () => ({ analysisId: ID, status: "analyzing", runCount: 1 })
  };
  const runner = createAgentAnalysisRunner({
    evidenceStore: { readSource: readSource ?? (async () => {
      calls.push(["source"]); return { bytes: BYTES, mediaType: "image/jpeg" };
    }) },
    analysisStore,
    analyzer: { start: start ?? (async input => {
      calls.push(["provider", input]); return { status: "queued", responseId: "resp_123" };
    }) },
    taskEnqueuer: { enqueue: enqueue ?? (async input => { calls.push(["enqueue", input]); }) }
  });
  return { calls, runner };
}

test("starts, persists the provider id, then dispatches the private task", async () => {
  const { calls, runner } = harness();
  const result = await runner.run({ ownerKey: OWNER, analysisId: ID });
  assert.deepEqual(calls.map(([kind]) => kind),
    ["analyzing", "source", "provider", "provider-id", "enqueue"]);
  assert.equal(calls.find(([kind]) => kind === "provider")[1].imageBase64,
    BYTES.toString("base64"));
  assert.deepEqual(calls.find(([kind]) => kind === "enqueue")[1],
    { ownerKey: OWNER, analysisId: ID, runId: RUN, dueAt: DUE });
  assert.equal(result.status, "analyzing");
});

test("a queue outage leaves durable due work for reconciliation", async () => {
  const { calls, runner } = harness({ enqueue: async () => {
    calls.push(["enqueue"]); throw new Error("queue unavailable");
  } });
  const result = await runner.run({ ownerKey: OWNER, analysisId: ID });
  assert.equal(result.status, "analyzing");
  assert.ok(calls.some(([kind]) => kind === "provider-id"));
  assert.ok(!calls.some(([kind]) => kind === "failed"));
});

test("an uncertain provider start is visible as analyzing and never auto-retried", async () => {
  const { calls, runner } = harness({ start: async () => {
    throw new ProviderError("timeout", { failureClass: "provider_timeout" });
  } });
  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }), ProviderError);
  assert.ok(!calls.some(([kind]) => kind === "failed"));
  assert.ok(!calls.some(([kind]) => kind === "enqueue"));
});

test("a definite provider rejection settles failed", async () => {
  const { calls, runner } = harness({ start: async () => {
    throw new ProviderError("response", { providerStatus: 400 });
  } });
  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }), ProviderError);
  assert.equal(calls.find(([kind]) => kind === "failed")[1].reason,
    "provider_failed");
});

test("an unreadable source settles as storage failure", async () => {
  const { calls, runner } = harness({ readSource: async () => {
    throw new AgentEvidenceUnavailableError(new Error("gone"));
  } });
  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }));
  assert.equal(calls.find(([kind]) => kind === "failed")[1].reason,
    "storage_unavailable");
});

test("provider-id persistence failure never dispatches or falsely settles", async () => {
  const { calls, runner } = harness({ markProviderStarted: async input => {
    calls.push(["provider-id", input]); throw new Error("firestore unavailable");
  } });
  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }),
    /firestore unavailable/);
  assert.ok(!calls.some(([kind]) => kind === "enqueue"));
  assert.ok(!calls.some(([kind]) => kind === "failed"));
});

test("requires every start-orchestration collaborator", () => {
  assert.throws(() => createAgentAnalysisRunner({}), TypeError);
});

test("memory sampler records maxima and clears both timers on abort", () => {
  const cleared = [];
  let tick;
  let rss = 100;
  const abort = new AbortController();
  const sampler = createRunMemorySampler({ signal: abort.signal,
    readMemory: () => ({ rss: rss++, heapUsed: 20, external: 10, arrayBuffers: 8 }),
    setIntervalImpl: fn => { tick = fn; return 1; }, setTimeoutImpl: () => 2,
    clearIntervalImpl: id => cleared.push(id), clearTimeoutImpl: id => cleared.push(id) });
  tick(); tick();
  assert.equal(sampler.summary().sampledMax.rssBytes, 102);
  abort.abort();
  assert.deepEqual(cleared, [1, 2]);
});
