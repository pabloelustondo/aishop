// Sprint 013: real Auth/Storage/Firestore composition with a fixture provider
// and an in-process queue. No provider credential and no external call.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { createAgentAnalysisStore } from "../src/agent-analysis-store.js";
import { createAgentDueWorkReader } from "../src/agent-due-work-reader.js";
import { API_PROCESS_CONTEXT, createProcessContext } from "../src/firebase-agent-config.js";
import { createFirebaseAgentBackground } from "../src/firebase-agent-background.js";
import { createFirebaseAgentHandler } from "../src/firebase-agent-handler.js";
import { createFirebaseAgentServices } from "../src/firebase-services.js";
import { mintEmulatorUser } from "../../e2e/server/emulator-auth.mjs";

for (const key of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  assert.match(process.env[key] ?? "", /^(127\.0\.0\.1|localhost):\d+$/,
    `${key} must be local`);
}
const PROJECT = "demo-aishop-e2e";
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com` });
getApps()[0] ?? initializeApp({ projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com` });

let collectionTime = Date.now();
const firestore = getFirestore();
const baseServices = createFirebaseAgentServices();
const analysisStore = createAgentAnalysisStore({ firestore,
  serverTimestamp: FieldValue.serverTimestamp,
  clock: () => Timestamp.now().toDate(),
  collectionClock: () => new Date(collectionTime) });
const services = { ...baseServices, analysisStore,
  dueWorkReader: createAgentDueWorkReader({ firestore,
    clock: () => new Date(collectionTime) }) };

const queued = [];
let failNextDispatch = false;
const taskEnqueuer = { enqueue: async work => {
  if (failNextDispatch) { failNextDispatch = false; throw new Error("fixture queue outage"); }
  queued.push(work);
} };

const report = { summary: "fixture", identifiedProducts: [{ name: "Fixture product",
  count: 2, confidence: "high", visibleEvidence: ["fixture"] }], uncertainItems: [] };
const provider = new Map();
let providerStarts = 0;
let providerRetrieves = 0;
let providerDeletes = 0;
let currentAnalysisId = null;
let blockNextRetrieve = false;
let retrieveStarted;
let releaseRetrieve;
const retrieveStartedPromise = () => new Promise(resolve => { retrieveStarted = resolve; });

const providerFetch = async (url, options) => {
  if (options.method === "POST") {
    const id = `resp_e2e_${++providerStarts}`;
    provider.set(id, { analysisId: currentAnalysisId, polls: 0 });
    return response({ id, status: "queued", model: "gpt-fixture" });
  }
  const id = url.split("/").at(-1);
  if (options.method === "GET") {
    providerRetrieves++;
    const state = provider.get(id);
    state.polls++;
    if (blockNextRetrieve) {
      blockNextRetrieve = false;
      retrieveStarted();
      await new Promise(resolve => { releaseRetrieve = resolve; });
    }
    return state.polls === 1 && id === "resp_e2e_1"
      ? response({ id, status: "in_progress", model: "gpt-fixture" })
      : response({ id, status: "completed", model: "gpt-fixture",
        output_text: JSON.stringify(report) });
  }
  const state = provider.get(id);
  const settled = await analysisStore.read({ ownerKey: activeOwner,
    analysisId: state.analysisId });
  assert.ok(["analyzed", "failed"].includes(settled.status),
    "provider cleanup must follow durable terminal settlement");
  providerDeletes++;
  return response({ id, deleted: true });
};
const response = body => new Response(JSON.stringify(body), { status: 200,
  headers: { "x-request-id": "req_e2e" } });

const handler = createFirebaseAgentHandler({ apiKey: "offline-fixture-only",
  environment: "emulator", release: "fixture", services, taskEnqueuer,
  logger: { info: () => {}, error: () => {} }, fetchImpl: providerFetch });
const background = createFirebaseAgentBackground({ apiKey: "offline-fixture-only",
  model: "gpt-fixture", services, taskEnqueuer, fetchImpl: providerFetch });
const nextContext = createProcessContext();
const server = createServer(async (request, responseObject) => {
  request[API_PROCESS_CONTEXT] = nextContext();
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  request.rawBody = Buffer.concat(chunks);
  await handler(request, responseObject);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

const JPEG = readFileSync(new URL("../contracts/vista-server-endpoint-agent-handoff-v0.1/" +
  "fixtures/valid/accepted-detail.jpg", import.meta.url));
const { idToken, uid } = await mintEmulatorUser();
const activeOwner = createHash("sha256").update(uid).digest("hex");
const base = `http://127.0.0.1:${server.address().port}/v1/agent/analyses`;
const call = (method, path = "", body) => fetch(base + path, { method,
  headers: { authorization: `Bearer ${idToken}`,
    ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}) },
  body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
async function upload() {
  const form = new FormData();
  form.append("file", new Blob([JPEG], { type: "image/jpeg" }), "shelf.jpg");
  const result = await call("POST", "", form);
  assert.equal(result.status, 201);
  return (await result.json()).analysis.analysisId;
}

try {
  // A failed initial dispatch remains durable; page GETs cannot advance it.
  const firstId = await upload();
  currentAnalysisId = firstId;
  failNextDispatch = true;
  let result = await call("POST", `/${firstId}/run`);
  assert.equal(result.status, 200);
  let body = await result.json();
  assert.equal(body.analysis.status, "analyzing");
  assert.ok(!JSON.stringify(body).includes("resp_e2e_1"), "provider id is private");
  await call("GET", `/${firstId}`);
  await call("GET", `/${firstId}`);
  assert.equal(providerStarts, 1, "refresh cannot duplicate provider start");
  assert.equal(providerRetrieves, 0, "page GET cannot collect provider state");

  collectionTime += 16_000;
  const repaired = await background.reconcile();
  assert.equal(repaired.dispatched, 1, "reconciler repairs missed dispatch");
  const firstTask = queued.shift();
  await background.taskHandler({ data: { ownerKey: firstTask.ownerKey,
    analysisId: firstTask.analysisId, runId: firstTask.runId } });
  assert.equal(queued.length, 1, "intermediate provider state schedules another task");
  collectionTime += 16_000;
  const terminalTask = queued.shift();
  await background.taskHandler({ data: { ownerKey: terminalTask.ownerKey,
    analysisId: terminalTask.analysisId, runId: terminalTask.runId } });
  body = await (await call("GET", `/${firstId}`)).json();
  assert.equal(body.analysis.status, "analyzed");
  assert.equal(body.analysis.report.identifiedProducts[0].count, 2);
  assert.equal(providerDeletes, 1);
  const duplicate = await background.taskHandler({ data: {
    ownerKey: terminalTask.ownerKey, analysisId: terminalTask.analysisId,
    runId: terminalTask.runId } });
  assert.equal(duplicate.skipped, true, "duplicate terminal delivery is a no-op");

  // Two simultaneous deliveries: only the lease holder reaches the provider.
  const secondId = await upload();
  currentAnalysisId = secondId;
  await call("POST", `/${secondId}/run`);
  collectionTime += 16_000;
  const leaseTask = queued.shift();
  blockNextRetrieve = true;
  const started = retrieveStartedPromise();
  const firstDelivery = background.taskHandler({ data: { ownerKey: leaseTask.ownerKey,
    analysisId: leaseTask.analysisId, runId: leaseTask.runId } });
  await started;
  const secondDelivery = await background.taskHandler({ data: { ownerKey: leaseTask.ownerKey,
    analysisId: leaseTask.analysisId, runId: leaseTask.runId } });
  assert.equal(secondDelivery.reason, "leased");
  releaseRetrieve();
  await firstDelivery;
  assert.equal(providerStarts, 2);
  assert.equal(providerDeletes, 2);

  console.log("PASS step 06: server-owned background state survives refresh, reconciliation repairs dispatch, " +
    "intermediate and terminal collection settle, cleanup follows persistence, and lease/duplicate fencing hold.");
} finally {
  await new Promise(resolve => server.close(resolve));
}
