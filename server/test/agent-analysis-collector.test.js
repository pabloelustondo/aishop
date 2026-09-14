import assert from "node:assert/strict";
import test from "node:test";
import { createAgentAnalysisCollector } from "../src/agent-analysis-collector.js";
import { ProviderError } from "../src/errors.js";

const OWNER = "e".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const RUN = "56fe7ad1-7a4f-4ba8-86a6-04cfd701de2b";
const DUE = new Date("2026-09-13T15:00:30.000Z");
const INPUT = { ownerKey: OWNER, analysisId: ID, runId: RUN };
const REPORT = { summary: "one product", identifiedProducts: [{ name: "CeraVe",
  count: 3, visibleEvidence: ["front label"], confidence: "high" }],
uncertainItems: [] };

function harness({ claim, retrieve, remove, enqueue, reschedule,
  markAnalyzed, markFailed } = {}) {
  const calls = [];
  const collector = createAgentAnalysisCollector({ model: "gpt-test",
    analysisStore: {
      claimCollection: claim ?? (async () => ({ claimed: true,
        responseId: "resp_123", diagnostics: {} })),
      rescheduleCollection: reschedule ?? (async input => {
        calls.push(["reschedule", input]); return { scheduled: true, dueAt: DUE };
      }),
      markAnalyzed: markAnalyzed ?? (async input => calls.push(["analyzed", input])),
      markFailed: markFailed ?? (async input => calls.push(["failed", input]))
    },
    analyzer: {
      retrieve: retrieve ?? (async () => ({ status: "completed", report: REPORT })),
      delete: remove ?? (async input => calls.push(["delete", input]))
    },
    taskEnqueuer: { enqueue: enqueue ?? (async input => calls.push(["enqueue", input])) }
  });
  return { calls, collector };
}

test("completed output settles before best-effort provider deletion", async () => {
  const { calls, collector } = harness();
  const result = await collector.collect(INPUT);
  assert.deepEqual(calls.map(([kind]) => kind), ["analyzed", "delete"]);
  assert.equal(calls[0][1].model, "gpt-test");
  assert.equal(calls[0][1].report, REPORT);
  assert.equal(calls[0][1].diagnostics.productRows, 1);
  assert.equal(calls[0][1].diagnostics.facingTotal, 3);
  assert.deepEqual(result, { settled: true, status: "analyzed" });
});

test("pending output records a new due time before enqueueing", async () => {
  const { calls, collector } = harness({ retrieve: async () => ({ status: "in_progress" }) });
  const result = await collector.collect(INPUT);
  assert.deepEqual(calls.map(([kind]) => kind), ["reschedule", "enqueue"]);
  assert.deepEqual(calls[1][1], { ...INPUT, dueAt: DUE });
  assert.equal(result.pending, true);
});

test("stale and duplicate deliveries do not contact the provider", async () => {
  let retrieved = false;
  const { collector } = harness({ claim: async () => ({ claimed: false,
    reason: "stale-run" }), retrieve: async () => { retrieved = true; } });
  const result = await collector.collect(INPUT);
  assert.equal(retrieved, false);
  assert.deepEqual(result, { settled: false, skipped: true, reason: "stale-run" });
});

test("terminal provider output settles failed before cleanup", async () => {
  const { calls, collector } = harness({ retrieve: async () => {
    throw new ProviderError("invalid-response", { responseStatus: "incomplete" });
  } });
  const result = await collector.collect(INPUT);
  assert.deepEqual(calls.map(([kind]) => kind), ["failed", "delete"]);
  assert.equal(result.status, "failed");
});

test("expired provider output settles failed", async () => {
  const { calls, collector } = harness({ retrieve: async () => {
    throw new ProviderError("response", { providerStatus: 404 });
  } });
  await collector.collect(INPUT);
  assert.deepEqual(calls.map(([kind]) => kind), ["failed", "delete"]);
});

test("transport trouble reschedules without false terminal settlement", async () => {
  const { calls, collector } = harness({ retrieve: async () => {
    throw new ProviderError("timeout", { failureClass: "provider_timeout" });
  } });
  const result = await collector.collect(INPUT);
  assert.deepEqual(calls.map(([kind]) => kind), ["reschedule", "enqueue"]);
  assert.equal(result.pending, true);
});

test("settlement failure prevents provider deletion", async () => {
  let deleted = false;
  const { collector } = harness({ markAnalyzed: async () => {
    throw new Error("firestore unavailable"); }, remove: async () => { deleted = true; } });
  await assert.rejects(collector.collect(INPUT), /firestore unavailable/);
  assert.equal(deleted, false);
});

test("cleanup and enqueue failures do not undo durable state", async () => {
  const complete = harness({ remove: async () => { throw new Error("delete failed"); } });
  assert.equal((await complete.collector.collect(INPUT)).status, "analyzed");
  const pending = harness({ retrieve: async () => ({ status: "queued" }),
    enqueue: async () => { throw new Error("queue failed"); } });
  assert.equal((await pending.collector.collect(INPUT)).pending, true);
});
