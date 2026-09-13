// Step 05: a successful refinement really persists, without paying a provider.
//
// Step 04 drives the HTTP path, but with no credential in the emulators every
// run there settles `failed`. That proves a run is never lost; it does not
// prove the successful-refinement history, which is the shape the whole run
// decision rests on. This drives the store directly against the Firestore
// emulator instead: a real report is stored, the record is reopened with a
// note, and a second report settles. No HTTP, no provider, no cost.
//
// It lives under `server/` rather than `e2e/` for one dull reason: it imports
// firebase-admin, and there is no node_modules at the repository root.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  AgentAnalysisContextRequiredError,
  createAgentAnalysisStore
} from "../src/agent-analysis-store.js";

assert.ok(process.env.FIRESTORE_EMULATOR_HOST,
  "refusing to run outside the Firestore emulator");

const app = getApps()[0] ?? initializeApp({ projectId: "demo-aishop-e2e" });
const store = createAgentAnalysisStore({
  firestore: getFirestore(app),
  serverTimestamp: FieldValue.serverTimestamp,
  clock: () => Timestamp.now().toDate()
});

const ownerKey = createHash("sha256").update(randomUUID()).digest("hex");
const analysisId = randomUUID().replaceAll("-", "");

const report = (summary, count) => ({
  summary,
  identifiedProducts: [{
    name: "CeraVe Moisturising Lotion", count,
    visibleEvidence: ["front label"], confidence: "high"
  }],
  uncertainItems: []
});

await store.create({
  ownerKey, analysisId, fileName: "shelf.jpg", mediaType: "image/jpeg",
  sha256: "a".repeat(64), byteLength: 4096
});

// --- run 1: the automatic first run, no note --------------------------------
await store.markAnalyzing({ ownerKey, analysisId });
await store.markAnalyzed({
  ownerKey, analysisId, report: report("three facings", 3),
  model: "gpt-test", mode: "areaScan"
});

// --- a contextless refine is refused by the real database, not just a fake --
await assert.rejects(
  store.markAnalyzing({ ownerKey, analysisId }),
  AgentAnalysisContextRequiredError,
  "reopening an analysed record without a note must be refused"
);
assert.equal((await store.read({ ownerKey, analysisId })).runCount, 1,
  "a refused refine must not open a run");

// --- run 2: the refine ------------------------------------------------------
await store.markAnalyzing({ ownerKey, analysisId, context: "ignore the top shelf" });
const running = await store.read({ ownerKey, analysisId });
assert.equal(running.status, "analyzing");
assert.equal(running.runs[1].context, "ignore the top shelf");

await store.markAnalyzed({
  ownerKey, analysisId, report: report("two facings, top shelf ignored", 2),
  model: "gpt-test", mode: "areaScan"
});

// --- both runs survive, each with its own instruction and its own answer ----
const settled = await store.read({ ownerKey, analysisId });
assert.equal(settled.status, "analyzed");
assert.equal(settled.runCount, 2, "a refine adds a run, it does not replace one");

const [first, second] = settled.runs;
assert.equal(first.context, null, "the automatic run carried no note");
assert.equal(first.status, "analyzed");
assert.equal(first.report.identifiedProducts[0].count, 3,
  "the first answer is not overwritten by the refined one");
assert.ok(first.startedAt, "a concrete timestamp survived inside an array element");

assert.equal(second.context, "ignore the top shelf");
assert.equal(second.status, "analyzed");
assert.equal(second.report.identifiedProducts[0].count, 2);
assert.ok(second.endedAt);

assert.equal(settled.report.identifiedProducts[0].count, 2,
  "the record surfaces the latest report");

console.log("PASS step-05: a successful refinement persists both runs,"
  + " each with the note that produced it. No provider call was made.");
