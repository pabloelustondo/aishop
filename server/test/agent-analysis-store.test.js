import assert from "node:assert/strict";
import test from "node:test";
import {
  AgentAnalysisNotFoundError,
  AgentAnalysisStateError,
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
    firestore, serverTimestamp: () => "server-time"
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
