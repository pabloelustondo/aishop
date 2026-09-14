import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  AgentEvidenceAlreadyExistsError,
  AgentEvidenceUnavailableError,
  createAgentEvidenceStore
} from "../src/agent-evidence-store.js";

const OWNER = "a".repeat(64);
const ANALYSIS = "01J8Z6M4QK7R9V2X5T3B0C1D2E";
const ATTEMPT = "attempt-current";
const JPEG = Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);

const savingBucket = (capture) => ({
  file: (path) => ({
    save: async (bytes, options) => { capture.saved = { path, bytes, options }; }
  })
});

const failingBucket = (code) => ({
  file: () => ({
    save: async () => {
      const error = new Error("storage refused");
      error.code = code;
      throw error;
    }
  })
});

test("stores source bytes privately under the owner-scoped path", async () => {
  const capture = {};
  const store = createAgentEvidenceStore({ bucket: savingBucket(capture) });

  const stored = await store.storeSource({
    ownerKey: OWNER, analysisId: ANALYSIS, bytes: JPEG, mediaType: "image/jpeg"
  });

  assert.equal(capture.saved.path, `agent/analyses/${OWNER}/${ANALYSIS}/source`);
  assert.deepEqual(capture.saved.bytes, JPEG);
  assert.equal(capture.saved.options.preconditionOpts.ifGenerationMatch, 0);
  assert.equal(capture.saved.options.resumable, false);
  assert.equal(capture.saved.options.metadata.contentType, "image/jpeg");
  assert.equal(capture.saved.options.metadata.cacheControl, "private, no-store");
  assert.equal(stored.sha256, createHash("sha256").update(JPEG).digest("hex"));
  assert.equal(stored.byteLength, JPEG.length);
  assert.equal(stored.path, capture.saved.path);
  assert.equal(capture.saved.options.metadata.metadata.sha256, stored.sha256);
  assert.equal(capture.saved.options.metadata.metadata.byteLength, String(JPEG.length));
  assert.equal(capture.saved.options.metadata.metadata.ownerKey, OWNER);
});

test("treats an existing source object as a conflict, never an overwrite", async () => {
  const store = createAgentEvidenceStore({ bucket: failingBucket(412) });

  await assert.rejects(
    store.storeSource({
      ownerKey: OWNER, analysisId: ANALYSIS, bytes: JPEG, mediaType: "image/jpeg"
    }),
    AgentEvidenceAlreadyExistsError
  );
});

test("reports any other storage failure as unavailable without leaking it", async () => {
  const store = createAgentEvidenceStore({ bucket: failingBucket(503) });

  await assert.rejects(
    store.storeSource({
      ownerKey: OWNER, analysisId: ANALYSIS, bytes: JPEG, mediaType: "image/jpeg"
    }),
    (error) => error instanceof AgentEvidenceUnavailableError
      && !/storage refused/.test(error.message)
  );
});

test("reads stored bytes back with their recorded media type", async () => {
  const bucket = {
    file: (path) => ({
      download: async () => [JPEG],
      getMetadata: async () => [{
        contentType: "image/jpeg",
        metadata: { sha256: "recorded", byteLength: String(JPEG.length), path }
      }]
    })
  };
  const store = createAgentEvidenceStore({ bucket });

  const source = await store.readSource({ ownerKey: OWNER, analysisId: ANALYSIS });

  assert.deepEqual(source.bytes, JPEG);
  assert.equal(source.mediaType, "image/jpeg");
  assert.equal(source.sha256, createHash("sha256").update(JPEG).digest("hex"));
});

test("creates one private origin-bound resumable video session", async () => {
  const capture = {};
  const bucket = { file: path => ({ createResumableUpload: async options => {
    capture.path = path; capture.options = options;
    return ["https://storage.invalid/private-session"];
  } }) };
  const store = createAgentEvidenceStore({ bucket });
  const session = await store.createVideoUploadSession({ ownerKey: OWNER,
    analysisId: ANALYSIS, mediaType: "video/quicktime", byteLength: 5_000,
    origin: "https://aishop-99d36.web.app" });
  assert.equal(session.uri, "https://storage.invalid/private-session");
  assert.equal(capture.options.origin, "https://aishop-99d36.web.app");
  assert.equal(capture.options.private, true);
  assert.equal(capture.options.preconditionOpts.ifGenerationMatch, 0);
  assert.equal(capture.options.metadata.contentType, "video/quicktime");
  assert.equal(capture.options.metadata.metadata.expectedByteLength, "5000");
});

test("stores immutable JPEG frames and reads only the recorded manifest", async () => {
  const files = new Map();
  const bucket = { file: path => ({
    save: async (bytes, options) => { files.set(path, { bytes, options }); },
    download: async () => [files.get(path).bytes]
  }) };
  const store = createAgentEvidenceStore({ bucket });
  const stored = await store.storeFrame({ ownerKey: OWNER,
    analysisId: ANALYSIS, attemptId: ATTEMPT,
    index: 2, timestampMs: 1_500, bytes: JPEG });
  assert.match(stored.path, /attempts\/attempt-current\/frames\/002\.jpg$/);
  assert.equal(files.get(stored.path).options.preconditionOpts.ifGenerationMatch, 0);
  assert.equal(files.get(stored.path).options.metadata.contentType, "image/jpeg");
  const [frame] = await store.readFrames({ ownerKey: OWNER,
    analysisId: ANALYSIS, attemptId: ATTEMPT, frames: [stored] });
  assert.deepEqual(frame.bytes, JPEG);
  assert.equal(frame.timestampMs, 1_500);
  assert.equal(frame.sha256, stored.sha256);
});

test("isolates frame objects between video attempts", async () => {
  const paths = [];
  const store = createAgentEvidenceStore({ bucket: { file: path => ({
    save: async () => paths.push(path)
  }) } });
  await store.storeFrame({ ownerKey: OWNER, analysisId: ANALYSIS,
    attemptId: "attempt-one", index: 0, timestampMs: 0, bytes: JPEG });
  await store.storeFrame({ ownerKey: OWNER, analysisId: ANALYSIS,
    attemptId: "attempt-two", index: 0, timestampMs: 0, bytes: JPEG });
  assert.notEqual(paths[0], paths[1]);
});

test("invalidates only a bounded provider-issued resumable session", async () => {
  const calls = [];
  const store = createAgentEvidenceStore({ bucket: savingBucket({}),
    fetchImpl: async (url, options) => {
      calls.push({ url, options }); return new Response(null, { status: 499 });
    } });
  const uri = "https://storage.googleapis.com/upload/storage/v1/b/aishop/o?uploadType=resumable&upload_id=opaque";
  assert.deepEqual(await store.invalidateVideoUploadSession({ uri }),
    { invalidated: true });
  assert.equal(calls[0].options.method, "DELETE");
  await assert.rejects(store.invalidateVideoUploadSession({
    uri: "https://example.com/upload?upload_id=opaque" }), TypeError);
});

test("refuses identities that could escape the owner-scoped prefix", async () => {
  const store = createAgentEvidenceStore({ bucket: savingBucket({}) });
  const attempts = [
    { ownerKey: "../etc", analysisId: ANALYSIS },
    { ownerKey: OWNER.toUpperCase(), analysisId: ANALYSIS },
    { ownerKey: OWNER, analysisId: "../../other" },
    { ownerKey: OWNER, analysisId: "" }
  ];

  for (const attempt of attempts) {
    await assert.rejects(
      store.storeSource({ ...attempt, bytes: JPEG, mediaType: "image/jpeg" }),
      TypeError,
      `expected rejection for ${JSON.stringify(attempt)}`
    );
  }
});

test("requires a bucket and rejects empty evidence", async () => {
  assert.throws(() => createAgentEvidenceStore({}), TypeError);
  const store = createAgentEvidenceStore({ bucket: savingBucket({}) });
  await assert.rejects(
    store.storeSource({
      ownerKey: OWNER, analysisId: ANALYSIS, bytes: Buffer.alloc(0), mediaType: "image/jpeg"
    }),
    TypeError
  );
});
