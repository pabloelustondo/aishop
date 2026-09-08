import assert from "node:assert/strict";
import test from "node:test";
import {
  AgentAnalysisContextRequiredError,
  AgentAnalysisNotFoundError,
  AgentAnalysisRunLimitError,
  AgentAnalysisStateError,
  MAX_ANALYSIS_RUNS,
  createAgentAnalysisStore
} from "../src/agent-analysis-store.js";

const OWNER = "b".repeat(64);
const OTHER = "c".repeat(64);
const ID = "01J8Z6M4QK7R9V2X5T3B0C1D2E";

function harness(existing = null) {
  const calls = [];
  const owners = {};
  const doc = {
    create: async (data) => { calls.push(["create", data]); },
    get: async () => ({ exists: existing !== null, data: () => existing })
  };
  const firestore = {
    collection: (name) => {
      calls.push(["collection", name]);
      return { doc: (ownerKey) => {
        owners.ownerKey = ownerKey;
        return { collection: (sub) => ({
          doc: (id) => { owners.id = id; return doc; },
          orderBy: () => ({ limit: () => ({ get: async () => ({
            docs: [{ id: ID, data: () => existing ?? {} }]
          }) }) })
        }) };
      } };
    },
    runTransaction: async (work) => work({
      get: async () => ({ exists: existing !== null, data: () => existing }),
      update: (...args) => calls.push(["update", ...args])
    })
  };
  const store = createAgentAnalysisStore({
    firestore, serverTimestamp: () => "server-time", clock: () => "run-time"
  });
  return { store, calls, owners };
}

test("creates an uploaded record holding descriptors, never bytes", async () => {
  const { store, calls, owners } = harness();

  await store.create({
    ownerKey: OWNER, analysisId: ID, fileName: "shelf.jpg",
    mediaType: "image/jpeg", sha256: "d".repeat(64), byteLength: 4096
  });

  const [, data] = calls.find(([kind]) => kind === "create");
  assert.equal(data.status, "uploaded");
  assert.equal(data.ownerKey, OWNER);
  assert.equal(data.createdAt, "server-time");
  assert.equal(data.byteLength, 4096);
  assert.equal(data.report, null);
  assert.equal(owners.ownerKey, OWNER);
  assert.equal(owners.id, ID);
  for (const forbidden of ["bytes", "imageBase64", "source", "buffer"]) {
    assert.ok(!Object.hasOwn(data, forbidden), `${forbidden} must not be stored`);
  }
});

test("moves uploaded to analyzing, and analyzing to analyzed with its report", async () => {
  const started = harness({ status: "uploaded", ownerKey: OWNER });
  await started.store.markAnalyzing({ ownerKey: OWNER, analysisId: ID });
  const [, , startPatch] = started.calls.find(([kind]) => kind === "update");
  assert.equal(startPatch.status, "analyzing");

  const done = harness({ status: "analyzing", ownerKey: OWNER });
  await done.store.markAnalyzed({
    ownerKey: OWNER, analysisId: ID,
    report: { summary: "two products" }, model: "gpt-x", mode: "areaScan"
  });
  const [, , patch] = done.calls.find(([kind]) => kind === "update");
  assert.equal(patch.status, "analyzed");
  assert.equal(patch.report.summary, "two products");
  assert.equal(patch.model, "gpt-x");
  assert.equal(patch.analyzedAt, "server-time");
});

test("records a failure with its reason instead of losing the run", async () => {
  const { store, calls } = harness({ status: "analyzing", ownerKey: OWNER });
  await store.markFailed({ ownerKey: OWNER, analysisId: ID, reason: "provider_timeout" });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.status, "failed");
  assert.equal(patch.failureReason, "provider_timeout");
  assert.equal(patch.report, null);
});

test("refuses transitions that the current status does not allow", async () => {
  const analyzed = harness({ status: "analyzed", ownerKey: OWNER });
  await assert.rejects(
    analyzed.store.markAnalyzed({
      ownerKey: OWNER, analysisId: ID, report: {}, model: "m", mode: "areaScan"
    }),
    AgentAnalysisStateError
  );

  const uploaded = harness({ status: "uploaded", ownerKey: OWNER });
  await assert.rejects(
    uploaded.store.markFailed({ ownerKey: OWNER, analysisId: ID, reason: "x" }),
    AgentAnalysisStateError
  );
});

test("allows a failed analysis to be run again", async () => {
  const { store, calls } = harness({ status: "failed", ownerKey: OWNER });
  await store.markAnalyzing({ ownerKey: OWNER, analysisId: ID });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.status, "analyzing");
  assert.equal(patch.failureReason, null);
});

test("reports a missing record rather than inventing one", async () => {
  const { store } = harness(null);
  await assert.rejects(
    store.markAnalyzing({ ownerKey: OWNER, analysisId: ID }),
    AgentAnalysisNotFoundError
  );
  assert.equal(await store.read({ ownerKey: OWNER, analysisId: ID }), null);
});

test("reads and lists only within the caller's own owner key", async () => {
  const { store, owners } = harness({ status: "analyzed", ownerKey: OWNER });

  await store.read({ ownerKey: OTHER, analysisId: ID });
  assert.equal(owners.ownerKey, OTHER, "the read must be scoped to the caller");

  const listed = await store.list({ ownerKey: OTHER });
  assert.equal(owners.ownerKey, OTHER);
  assert.equal(listed[0].analysisId, ID);
});

test("appends one run entry per attempt, carrying the context that produced it", async () => {
  const { store, calls } = harness({ status: "uploaded", ownerKey: OWNER, runs: [] });

  await store.markAnalyzing({
    ownerKey: OWNER, analysisId: ID, context: "  ignore the top shelf  "
  });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.runs.length, 1);
  assert.equal(patch.runs[0].runNumber, 1);
  assert.equal(patch.runs[0].context, "ignore the top shelf",
    "the note is trimmed and kept beside the run it instructed");
  assert.equal(patch.runs[0].status, "analyzing");
  assert.equal(patch.runs[0].startedAt, "run-time");
  assert.equal(patch.runs[0].report, null);
});

test("treats a blank or absent note as no context rather than an empty instruction", async () => {
  const blank = harness({ status: "uploaded", ownerKey: OWNER, runs: [] });
  await blank.store.markAnalyzing({ ownerKey: OWNER, analysisId: ID, context: "   " });
  const [, , blankPatch] = blank.calls.find(([kind]) => kind === "update");
  assert.equal(blankPatch.runs[0].context, null);

  const absent = harness({ status: "uploaded", ownerKey: OWNER, runs: [] });
  await absent.store.markAnalyzing({ ownerKey: OWNER, analysisId: ID });
  const [, , absentPatch] = absent.calls.find(([kind]) => kind === "update");
  assert.equal(absentPatch.runs[0].context, null);
});

test("closes the open run with its own report rather than only the record", async () => {
  const open = [{ runNumber: 1, context: "count the boxes behind", status: "analyzing",
    startedAt: "earlier", endedAt: null, report: null }];
  const { store, calls } = harness({ status: "analyzing", ownerKey: OWNER, runs: open });

  await store.markAnalyzed({
    ownerKey: OWNER, analysisId: ID,
    report: { summary: "two products" }, model: "gpt-x", mode: "areaScan"
  });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.runs.length, 1, "a completed run closes its entry, it does not add one");
  assert.equal(patch.runs[0].status, "analyzed");
  assert.equal(patch.runs[0].report.summary, "two products");
  assert.equal(patch.runs[0].model, "gpt-x");
  assert.equal(patch.runs[0].context, "count the boxes behind",
    "the instruction stays readable beside the report it produced");
  assert.equal(patch.runs[0].endedAt, "run-time");
  assert.equal(patch.report.summary, "two products", "the record still surfaces the latest report");
});

test("closes the open run with its failure reason", async () => {
  const open = [{ runNumber: 1, context: null, status: "analyzing", startedAt: "earlier" }];
  const { store, calls } = harness({ status: "analyzing", ownerKey: OWNER, runs: open });

  await store.markFailed({ ownerKey: OWNER, analysisId: ID, reason: "provider_timeout" });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.runs[0].status, "failed");
  assert.equal(patch.runs[0].failureReason, "provider_timeout");
  assert.equal(patch.runs[0].report, null);
});

test("reopens an analyzed record so a refine can run, keeping the earlier run", async () => {
  const done = [{ runNumber: 1, context: null, status: "analyzed",
    startedAt: "earlier", endedAt: "earlier", report: { summary: "first" } }];
  const { store, calls } = harness({ status: "analyzed", ownerKey: OWNER, runs: done });

  await store.markAnalyzing({
    ownerKey: OWNER, analysisId: ID, context: "this is the CeraVe bay"
  });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.status, "analyzing");
  assert.equal(patch.runs.length, 2);
  assert.equal(patch.runs[0].report.summary, "first", "the earlier run is not overwritten");
  assert.equal(patch.runs[1].runNumber, 2);
  assert.equal(patch.runs[1].context, "this is the CeraVe bay");
});

test("refuses to reopen a record beyond the run ceiling instead of growing without bound", async () => {
  const many = Array.from({ length: MAX_ANALYSIS_RUNS }, (_, index) => ({
    runNumber: index + 1, context: null, status: "analyzed"
  }));
  const { store } = harness({ status: "analyzed", ownerKey: OWNER, runs: many });

  await assert.rejects(
    store.markAnalyzing({ ownerKey: OWNER, analysisId: ID, context: "once more" }),
    AgentAnalysisRunLimitError
  );
});

test("surfaces the run history and its count on a read", async () => {
  const runs = [{ runNumber: 1, context: null, status: "analyzed", report: { summary: "first" } }];
  const { store } = harness({ status: "analyzed", ownerKey: OWNER, runs, report: { summary: "first" } });

  const record = await store.read({ ownerKey: OWNER, analysisId: ID });
  assert.equal(record.runCount, 1);
  assert.equal(record.runs[0].report.summary, "first");
});

test("refuses to reopen an analyzed record without a note", async () => {
  const done = [{ runNumber: 1, context: null, status: "analyzed",
    report: { summary: "first" } }];

  for (const blank of [undefined, null, "", "   ", 42]) {
    const { store, calls } = harness({ status: "analyzed", ownerKey: OWNER, runs: done });
    await assert.rejects(
      store.markAnalyzing({ ownerKey: OWNER, analysisId: ID, context: blank }),
      AgentAnalysisContextRequiredError,
      `${JSON.stringify(blank)} must not reopen an analysed record`
    );
    assert.ok(!calls.some(([kind]) => kind === "update"),
      "a refused refine must not touch the record");
  }
});

test("a note is required only where a run would otherwise repeat itself", async () => {
  // Retry after failure needs no note: nothing was produced, so the same
  // input is worth resending.
  const failed = harness({ status: "failed", ownerKey: OWNER, runs: [
    { runNumber: 1, context: null, status: "failed" }] });
  await failed.store.markAnalyzing({ ownerKey: OWNER, analysisId: ID });
  assert.ok(failed.calls.some(([kind]) => kind === "update"));

  // A first run has produced nothing either.
  const uploaded = harness({ status: "uploaded", ownerKey: OWNER, runs: [] });
  await uploaded.store.markAnalyzing({ ownerKey: OWNER, analysisId: ID });
  assert.ok(uploaded.calls.some(([kind]) => kind === "update"));
});

test("a refine with a real note still reopens an analyzed record", async () => {
  const done = [{ runNumber: 1, context: null, status: "analyzed" }];
  const { store, calls } = harness({ status: "analyzed", ownerKey: OWNER, runs: done });

  await store.markAnalyzing({
    ownerKey: OWNER, analysisId: ID, context: "  ignore the top shelf  "
  });

  const [, , patch] = calls.find(([kind]) => kind === "update");
  assert.equal(patch.runs[1].context, "ignore the top shelf");
});

test('reservation returns immutable identity and sanitizes diagnostics',async()=>{
 const {store,calls}=harness({status:'uploaded'});
 const run=await store.markAnalyzing({ownerKey:OWNER,analysisId:ID,diagnostics:{requestId:'req-1',maxOutputTokens:1200,note:'PRIVATE'}});
 assert.ok(run.runId); assert.equal(run.trigger,'initial');
 const patch=calls.find(c=>c[0]==='update')[2];
 assert.equal(patch.runs[0].diagnostics.maxOutputTokens,1200);
 assert.ok(!JSON.stringify(patch).includes('PRIVATE'));
});

test('a stale completion cannot close a different active run',async()=>{
 const {store}=harness({status:'analyzing',runs:[{runId:'current-run',status:'analyzing'}]});
 await assert.rejects(store.markFailed({ownerKey:OWNER,analysisId:ID,runId:'stale-run',reason:'provider_failed'}),AgentAnalysisStateError);
});
