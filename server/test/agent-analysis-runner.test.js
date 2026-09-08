import assert from "node:assert/strict";
import test from "node:test";
import { ProviderError } from "../src/errors.js";
import { createAgentAnalysisRunner } from "../src/agent-analysis-runner.js";
import { AgentEvidenceUnavailableError } from "../src/agent-evidence-store.js";

const OWNER = "e".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const BYTES = Buffer.from([0xff, 0xd8, 7, 7, 0xff, 0xd9]);
const REPORT = Object.freeze({
  summary: "one product",
  identifiedProducts: [{ name: "CeraVe Moisturising Lotion", count: 3,
    visibleEvidence: ["front label"], confidence: "high" }],
  uncertainItems: []
});

function harness({ analyze, read, diagnostics } = {}) {
  const calls = [];
  const analysisStore = {
    markAnalyzing: async (input) => { calls.push(["analyzing", input]); },
    markAnalyzed: async (input) => { calls.push(["analyzed", input]); },
    markFailed: async (input) => { calls.push(["failed", input]); },
    read: async () => ({ analysisId: ID, status: "analyzed", report: REPORT })
  };
  const evidenceStore = {
    readSource: read ?? (async () => ({ bytes: BYTES, mediaType: "image/jpeg" }))
  };
  const runner = createAgentAnalysisRunner({
    evidenceStore, analysisStore, model: "gpt-test", diagnostics,
    analyzeProduct: analyze ?? (async () => REPORT)
  });
  return { runner, calls };
}

test("marks the run started, analyses the stored bytes, and stores the report", async () => {
  let seen;
  const { runner, calls } = harness({ analyze: async (input) => { seen = input; return REPORT; } });

  const result = await runner.run({ ownerKey: OWNER, analysisId: ID });

  assert.deepEqual(calls.map(([kind]) => kind), ["analyzing", "analyzed"]);
  assert.equal(seen.mediaType, "image/jpeg");
  assert.equal(seen.imageBase64, BYTES.toString("base64"));
  assert.equal(seen.mode, "areaScan");
  const [, stored] = calls.find(([kind]) => kind === "analyzed");
  assert.equal(stored.model, "gpt-test");
  assert.equal(stored.mode, "areaScan");
  assert.equal(stored.report.identifiedProducts[0].count, 3);
  assert.equal(result.status, "analyzed");
});

test("records a provider failure on the run instead of losing it", async () => {
  const { runner, calls } = harness({
    analyze: async () => { throw new ProviderError("timeout"); }
  });

  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }), ProviderError);

  const [, failure] = calls.find(([kind]) => kind === "failed");
  assert.equal(failure.reason, "provider_timeout");
  assert.ok(!calls.some(([kind]) => kind === "analyzed"));
});

test("classifies an unreadable source as a storage failure, not a provider one", async () => {
  const { runner, calls } = harness({
    read: async () => { throw new AgentEvidenceUnavailableError(new Error("gone")); }
  });

  await assert.rejects(runner.run({ ownerKey: OWNER, analysisId: ID }));

  const [, failure] = calls.find(([kind]) => kind === "failed");
  assert.equal(failure.reason, "storage_unavailable");
});

test("never spends a provider call before the run is marked started", async () => {
  const order = [];
  const analysisStore = {
    markAnalyzing: async () => { order.push("analyzing"); },
    markAnalyzed: async () => { order.push("analyzed"); },
    markFailed: async () => { order.push("failed"); },
    read: async () => ({ status: "analyzed" })
  };
  const runner = createAgentAnalysisRunner({
    analysisStore, model: "m",
    evidenceStore: { readSource: async () => {
      order.push("read"); return { bytes: BYTES, mediaType: "image/jpeg" };
    } },
    analyzeProduct: async () => { order.push("provider"); return REPORT; }
  });

  await runner.run({ ownerKey: OWNER, analysisId: ID });
  assert.deepEqual(order, ["analyzing", "read", "provider", "analyzed"]);
});

test("requires its collaborators", () => {
  assert.throws(() => createAgentAnalysisRunner({}), TypeError);
});

test("carries a refine note to the provider and onto the run it opened", async () => {
  let seen;
  const { runner, calls } = harness({
    analyze: async (input) => { seen = input; return REPORT; }
  });

  await runner.run({
    ownerKey: OWNER, analysisId: ID, context: "ignore the top shelf"
  });

  assert.equal(seen.context, "ignore the top shelf",
    "the note must reach the model, or the endpoint accepting it is a lie");
  const [, opened] = calls.find(([kind]) => kind === "analyzing");
  assert.equal(opened.context, "ignore the top shelf",
    "the run records the instruction that produced its report");
});

test("a run with no note asks exactly what it asked before", async () => {
  let seen;
  const { runner, calls } = harness({
    analyze: async (input) => { seen = input; return REPORT; }
  });

  await runner.run({ ownerKey: OWNER, analysisId: ID });

  assert.equal(seen.context ?? null, null);
  const [, opened] = calls.find(([kind]) => kind === "analyzing");
  assert.equal(opened.context ?? null, null);
});

test('secondary persistence failure preserves original provider error and both diagnostics',async()=>{
 const events=[]; const original=new ProviderError('invalid-response',{failureClass:'provider_output_limit'});
 const runner=createAgentAnalysisRunner({diagnostics:(event,data)=>events.push({event,...data}),analysisStore:{markAnalyzing:async()=>({runId:'run1',runNumber:1,trigger:'initial'}),markFailed:async()=>{throw Error('PRIVATE')},read:async()=>null},evidenceStore:{readSource:async()=>({bytes:BYTES})},analyzeProduct:async()=>{throw original}});
 await assert.rejects(runner.run({ownerKey:OWNER,analysisId:ID}),e=>e===original);
 assert.ok(events.some(e=>e.event==='persistence.failed' && e.failureClass==='persistence_failed'));
 assert.ok(events.some(e=>e.failureClass==='provider_output_limit'));
 assert.ok(!events.some(e=>e.event==='run.failed'));
});


test("provider stage and adapter transport timings remain distinct in events and persistence", async () => {
  const events = [];
  const { runner, calls } = harness({
    diagnostics: (event, fields) => events.push({ event, ...fields }),
    analyze: async ({ onDiagnostics }) => {
      onDiagnostics({ durations: { provider_transport: 2, report_validation: 1 } });
      return REPORT;
    }
  });
  await runner.run({ ownerKey: OWNER, analysisId: ID });
  const stage = events.find(event => event.event === "stage.completed" && event.stage === "provider");
  const stored = calls.find(([kind]) => kind === "analyzed")[1].diagnostics.durations;
  assert.equal(stored.provider, stage.durationMs);
  assert.equal(stored.provider_transport, 2);
  assert.equal(stored.report_validation, 1);
});
