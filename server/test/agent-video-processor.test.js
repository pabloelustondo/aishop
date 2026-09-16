import assert from "node:assert/strict";
import { copyFile, readFile } from "node:fs/promises";
import test from "node:test";
import { createAgentVideoProcessor } from "../src/agent-video-processor.js";
import { AgentVideoError } from "../src/agent-video-media.js";

const OWNER = "a".repeat(64);
const ID = "video-analysis";
const ATTEMPT = "attempt-current";
const VIDEO = new URL("fixtures/video/three-frame.mov", import.meta.url);
const JPEG = new URL("../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg", import.meta.url);

function harness(initial = "processing", { inspectError } = {}) {
  const calls = [];
  let status = initial;
  const upload = () => ({ analysisId: ID, status, fileName: "shelf.mov",
    mediaType: "video/quicktime", expectedByteLength: 123, attemptId: ATTEMPT });
  const analysisStore = {
    readVideoUpload: async input => { calls.push(["read", input]); return upload(); },
    markVideoReady: async input => { calls.push(["ready", input]); status = "uploaded"; },
    markVideoFailed: async input => { calls.push(["failed", input]); status = "failed"; }
  };
  const evidenceStore = {
    downloadSource: async ({ destination }) => { calls.push(["download"]); await copyFile(VIDEO, destination); },
    storeFrame: async input => { calls.push(["frame", input]); return {
      index: input.index, timestampMs: input.timestampMs, path: `frame-${input.index}`,
      sha256: "b".repeat(64), byteLength: input.bytes.length
    }; }
  };
  const runner = { run: async input => { calls.push(["run", input]); status = "analyzing"; } };
  const inspect = async () => {
    if (inspectError) throw inspectError;
    return { byteLength: 123, durationMs: 3_000, width: 160, height: 120, codec: "h264" };
  };
  const extract = async () => [{ index: 0, timestampMs: 0, path: JPEG }];
  return { calls, process: createAgentVideoProcessor({ evidenceStore,
    analysisStore, runner, inspect, extract }).process };
}

test("processes one video into immutable frames then starts one analysis", async () => {
  const { calls, process } = harness();
  const result = await process({ ownerKey: OWNER, analysisId: ID,
    attemptId: ATTEMPT });
  assert.deepEqual(result, { processed: true, reason: "analysis-started" });
  assert.deepEqual(calls.map(([name]) => name),
    ["read", "download", "read", "frame", "ready", "read", "run"]);
  const ready = calls.find(([name]) => name === "ready")[1];
  assert.equal(ready.frames.length, 1);
  assert.equal(ready.sha256.length, 64);
  assert.equal(ready.attemptId, ATTEMPT);
  assert.equal(calls.find(([name]) => name === "frame")[1].attemptId, ATTEMPT);
  assert.ok((await readFile(JPEG)).length === ready.frames[0].byteLength);
});

test("a replay after analysis starts is a harmless no-op", async () => {
  const { calls, process } = harness("analyzing");
  assert.deepEqual(await process({ ownerKey: OWNER, analysisId: ID,
    attemptId: ATTEMPT }),
    { processed: false, reason: "already-started" });
  assert.deepEqual(calls.map(([name]) => name), ["read"]);
});

test("a validation failure settles the video without provider spend", async () => {
  const failure = new AgentVideoError("video_invalid");
  const { calls, process } = harness("processing", { inspectError: failure });
  await assert.rejects(process({ ownerKey: OWNER, analysisId: ID,
    attemptId: ATTEMPT }), failure);
  assert.deepEqual(calls.map(([name]) => name), ["read", "download", "failed"]);
});

test("a transient processing fault remains retryable", async () => {
  const failure = Object.assign(new Error("storage unavailable"), {
    code: "storage_unavailable"
  });
  const { calls, process } = harness("processing", { inspectError: failure });
  await assert.rejects(process({ ownerKey: OWNER, analysisId: ID,
    attemptId: ATTEMPT }), failure);
  assert.deepEqual(calls.map(([name]) => name), ["read", "download"]);
});

test("a stale processing attempt cannot write frames or start analysis", async () => {
  const { calls, process } = harness();
  assert.deepEqual(await process({ ownerKey: OWNER, analysisId: ID,
    attemptId: "attempt-stale" }), { processed: false, reason: "stale-attempt" });
  assert.deepEqual(calls.map(([name]) => name), ["read"]);
});
