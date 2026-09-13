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
