// Step 09 (Sprint 014): delegated MOV upload through real emulator Storage,
// deterministic FFmpeg extraction, one background provider start, durable
// collection, refresh-safe state and byte-identical private source retrieval.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { API_PROCESS_CONTEXT, createProcessContext }
  from "../../server/src/firebase-agent-config.js";
import { createFirebaseAgentBackground }
  from "../../server/src/firebase-agent-background.js";
import { createFirebaseAgentHandler }
  from "../../server/src/firebase-agent-handler.js";
import { createFirebaseAgentVideo }
  from "../../server/src/firebase-agent-video.js";
import { createFirebaseAgentServices } from "../../server/src/firebase-services.js";
import { mintEmulatorUser } from "./emulator-auth.mjs";

for (const key of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST"]) {
  assert.match(process.env[key] ?? "", /^(127\.0\.0\.1|localhost):\d+$/,
    `${key} must be local`);
}
const PROJECT = "demo-aishop-e2e";
process.env.GCLOUD_PROJECT = PROJECT;
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: PROJECT,
  storageBucket: `${PROJECT}.appspot.com` });
const VIDEO = readFileSync(new URL(
  "../../server/test/fixtures/video/three-frame.mov", import.meta.url));
const report = { summary: "fixture video", identifiedProducts: [{
  name: "Fixture product", count: 2, confidence: "high",
  visibleEvidence: ["present across sampled frames"] }], uncertainItems: [] };
let providerStarts = 0;
const providerFetch = async (_url, options) => new Response(JSON.stringify(
  options.method === "POST" ? { id: `resp_video_${++providerStarts}`,
    status: "queued", model: "gpt-fixture" }
    : options.method === "GET" ? { id: "resp_video_1", status: "completed",
      model: "gpt-fixture", output_text: JSON.stringify(report) }
      : { id: "resp_video_1", deleted: true }
), { status: 200, headers: { "x-request-id": "req_video_fixture" } });

let collectionTime = Date.now();
const services = createFirebaseAgentServices({
  collectionClock: () => new Date(collectionTime)
});
const collectionTasks = [], videoTasks = [];
const collectionQueue = { enqueue: async input => collectionTasks.push(input) };
const videoQueue = { enqueue: async input => videoTasks.push(input) };
const quiet = { info: () => {}, error: () => {} };
const agent = createFirebaseAgentHandler({ apiKey: "offline-fixture-only",
  environment: "emulator", release: "fixture", logger: quiet, services,
  taskEnqueuer: collectionQueue, videoTaskEnqueuer: videoQueue,
  fetchImpl: providerFetch });
const video = createFirebaseAgentVideo({ apiKey: "offline-fixture-only",
  services, taskEnqueuer: collectionQueue, fetchImpl: providerFetch,
  diagnostics: () => {} });
const background = createFirebaseAgentBackground({ apiKey: "offline-fixture-only",
  services, taskEnqueuer: collectionQueue, fetchImpl: providerFetch });
const nextProcessContext = createProcessContext();
const server = createServer(async (request, response) => {
  request[API_PROCESS_CONTEXT] = nextProcessContext();
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  request.rawBody = Buffer.concat(chunks);
  await agent(request, response);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const { idToken } = await mintEmulatorUser();
const call = (method, path, body, headers = {}) => fetch(origin + path, {
  method, headers: { authorization: `Bearer ${idToken}`, ...headers }, body
});

try {
  const reserved = await call("POST", "/v1/agent/video-uploads",
    JSON.stringify({ fileName: "three-frame.mov", mediaType: "video/quicktime",
      byteLength: VIDEO.length }), { "content-type": "application/json", origin });
  const created = await reserved.json();
  assert.equal(reserved.status, 201, JSON.stringify(created));
  assert.equal(created.analysis.status, "uploading");

  // The Storage emulator accepts the resumable URI but does not implement
  // production's 308 chunk protocol. Chunk interruption/resume is therefore
  // covered by the browser transport test; this gate proves the real object,
  // Firestore, extraction and background compositions together.
  const transferred = await fetch(created.upload.uri, { method: "PUT", headers: {
    "Content-Type": "video/quicktime",
    "Content-Range": `bytes 0-${VIDEO.length - 1}/${VIDEO.length}`
  }, body: VIDEO });
  assert.ok([200, 201].includes(transferred.status), await transferred.text());

  const completed = await call("POST",
    `/v1/agent/video-uploads/${created.analysis.analysisId}/complete`);
  assert.equal(completed.status, 200, await completed.text());
  assert.equal(videoTasks.length, 1);
  await video.taskHandler({ data: videoTasks.shift() });
  assert.equal(providerStarts, 1);
  assert.equal(collectionTasks.length, 1);
  await video.taskHandler({ data: { ownerKey: collectionTasks[0].ownerKey,
    analysisId: collectionTasks[0].analysisId } });
  assert.equal(providerStarts, 1, "a duplicate processing delivery starts no second response");

  collectionTime += 16_000;
  const task = collectionTasks.shift();
  await background.taskHandler({ data: { ownerKey: task.ownerKey,
    analysisId: task.analysisId, runId: task.runId } });
  const read = await call("GET", `/v1/agent/analyses/${created.analysis.analysisId}`);
  const settled = (await read.json()).analysis;
  assert.equal(settled.status, "analyzed");
  assert.equal(settled.mode, "videoAreaScan");
  assert.equal(settled.frames.length, 3);
  assert.equal(settled.report.identifiedProducts[0].count, 2);

  const source = await call("GET",
    `/v1/agent/analyses/${created.analysis.analysisId}/source`);
  assert.equal(source.status, 200);
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), VIDEO);
  const anonymous = await fetch(`${origin}/v1/agent/video-uploads`, {
    method: "POST", headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ fileName: "three-frame.mov",
      mediaType: "video/quicktime", byteLength: VIDEO.length })
  });
  assert.equal(anonymous.status, 401);
  console.log("PASS step-09: delegated MOV upload extracts three frames, "
    + "starts one response, settles, and returns original private bytes.");
} finally {
  await new Promise(resolve => server.close(resolve));
}
