/**
 * The agent page's decisions, tested as pure functions.
 *
 * This file lives under `server/test/` rather than beside the page because
 * `npm --prefix server test` is the repository's only test runner; a file in
 * `dashboard/` would never be executed. The client-side end-to-end gap named
 * in `docs/00-sdlc2-governance/end-to-end-happy-path-gate.md` is unchanged —
 * this covers the two decisions the page gets wrong, not the page.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  OBSERVATION_CEILING_MS, OBSERVATION_INTERVAL_MS, activityLabel,
  canRetryAnalysis, retryContextOf, recoveryActions, prepareVideoRecovery,
  refinementNote, safeStorageCode, shouldPollAnalyses, signInErrorMessage,
  shouldFallBackToRedirect,
  shouldRenewVideoUpload, uploadControlState, uploadVideoChunks,
  VIDEO_CHUNK_BYTES, VideoUploadTransportError
} from "../../dashboard/scripts/agent.js";

test("upload presentation names one file and every supported format", () => {
  const html = readFileSync(new URL("../../dashboard/agent.html", import.meta.url), "utf8");
  assert.match(html, />New shelf analysis</);
  assert.match(html, /Upload one photograph or video/);
  assert.match(html, /One file per analysis/);
  for (const format of ["image\/jpeg", "video\/mp4", "video\/quicktime", "\.mov"]) {
    assert.match(html, new RegExp(format));
  }
  assert.doesNotMatch(html, /id="file"[^>]*\smultiple(?:\s|=|>)/);
});

test("My runs names durable analysis activity instead of looking idle", () => {
  assert.equal(activityLabel([]), "Idle");
  assert.equal(activityLabel([{ status: "analyzing" }]), "Analysing 1 image");
  assert.equal(activityLabel([{ status: "analyzing" }, { status: "analyzing" }]),
    "Analysing 2 images");
  assert.equal(activityLabel([{ status: "uploading" }]), "1 upload needs attention");
  assert.equal(activityLabel([{ status: "processing" }]), "Preparing 1 video");
});

test("polling cannot close an upload form the user opened", () => {
  assert.deepEqual(uploadControlState({ analysisCount: 1, composerOpen: true }), {
    formHidden: false, triggerHidden: true
  });
  assert.deepEqual(uploadControlState({ analysisCount: 1 }), {
    formHidden: true, triggerHidden: false
  });
  assert.deepEqual(uploadControlState({ analysisCount: 1, composerOpen: true,
    uploadInFlight: true }), { formHidden: true, triggerHidden: true });
});

test("only a video with verified frames can retry provider analysis", () => {
  assert.equal(canRetryAnalysis({ status: "failed", mediaType: "image/jpeg" }), true);
  assert.equal(canRetryAnalysis({ status: "failed", mediaType: "video/quicktime",
    frames: [] }), false);
  assert.equal(canRetryAnalysis({ status: "failed", mediaType: "video/mp4",
    frames: [{ index: 0 }] }), true);
  assert.equal(canRetryAnalysis({ status: "processing", mediaType: "video/mp4",
    frames: [{ index: 0 }] }), false);
});

test("My runs observes server state every 15 seconds without advancing it", () => {
  assert.equal(OBSERVATION_INTERVAL_MS, 15_000);
  assert.equal(shouldPollAnalyses([{ status: "analyzing" }]), true,
    "a fresh page resumes observation from durable status");
  assert.equal(shouldPollAnalyses([{ status: "analyzed" }]), false);
  assert.equal(shouldPollAnalyses([{ status: "uploading" }]), true);
  assert.equal(shouldPollAnalyses([{ status: "processing" }]), true);
  assert.equal(shouldPollAnalyses([{ status: "analyzing" }], { visible: false }), false);
  assert.equal(shouldPollAnalyses([{ status: "analyzing" }],
    { elapsedMs: OBSERVATION_CEILING_MS }), false);
});

test("video upload resumes at the server offset and uses browser-safe headers", async () => {
  const calls = [];
  const file = { size: VIDEO_CHUNK_BYTES + 10, type: "video/quicktime",
    slice: (start, end) => ({ start, end }) };
  const responses = [
    { status: 308, headers: new Headers({ Range: "bytes=0-4" }) },
    { status: 308, headers: new Headers({ Range: `bytes=0-${VIDEO_CHUNK_BYTES + 4}` }) },
    { status: 200, headers: new Headers() }
  ];
  const progress = [];
  await uploadVideoChunks(file, "https://storage.invalid/session",
    ratio => progress.push(ratio), async (_uri, options) => {
      calls.push(options); return responses.shift();
    });
  assert.equal(calls[0].headers["Content-Range"], `bytes */${file.size}`);
  assert.equal(calls[1].headers["Content-Range"],
    `bytes 5-${VIDEO_CHUNK_BYTES + 4}/${file.size}`);
  assert.equal(calls[1].headers["Content-Length"], undefined);
  assert.equal(calls[2].headers["Content-Range"],
    `bytes ${VIDEO_CHUNK_BYTES + 5}-${file.size - 1}/${file.size}`);
  assert.equal(progress.at(-1), 1);
});

test("video upload trusts a partially persisted Storage range", async () => {
  const calls = [];
  const file = { size: VIDEO_CHUNK_BYTES + 20,
    slice: (start, end) => ({ start, end }) };
  const persisted = VIDEO_CHUNK_BYTES - 101;
  const responses = [
    { status: 308, headers: new Headers() },
    { status: 308, headers: new Headers({ Range: `bytes=0-${persisted}` }) },
    { status: 200, headers: new Headers() }
  ];

  await uploadVideoChunks(file, "https://storage.invalid/session", () => {},
    async (_uri, options) => { calls.push(options); return responses.shift(); });

  assert.equal(calls[1].headers["Content-Range"],
    `bytes 0-${VIDEO_CHUNK_BYTES - 1}/${file.size}`);
  assert.equal(calls[2].headers["Content-Range"],
    `bytes ${persisted + 1}-${file.size - 1}/${file.size}`,
  "the next request starts at Storage's confirmed byte, not the attempted end");
});

test("expired video upload sessions retain a safe actionable status", async () => {
  const file = { size: 1024, slice: () => ({}) };
  await assert.rejects(
    uploadVideoChunks(file, "https://storage.invalid/session", () => {},
      async () => ({ status: 410, headers: new Headers(),
        text: async () => "<Error><Code>UploadSessionExpired</Code><Details>private</Details></Error>" })),
    error => error instanceof VideoUploadTransportError
      && error.expired === true
      && error.status === 410
      && error.storageCode === "UploadSessionExpired"
      && !error.message.includes("private")
  );
});

test("only an expired resumable session can be replaced once", () => {
  const rejected = new VideoUploadTransportError("expired", { status: 410 });
  assert.equal(shouldRenewVideoUpload(rejected), true);
  assert.equal(shouldRenewVideoUpload(rejected, true), false);
  assert.equal(shouldRenewVideoUpload(new Error("network")), false);
  for (const status of [400, 401, 403, 412]) {
    assert.equal(shouldRenewVideoUpload(new VideoUploadTransportError("rejected", { status })), false);
  }
});

test("recovery controls follow durable status and available video evidence", () => {
  assert.deepEqual(recoveryActions({ status: "uploading" }), ["resume", "cancel", "fresh"]);
  assert.deepEqual(recoveryActions({ status: "analyzing" }), ["cancel"]);
  assert.deepEqual(recoveryActions({ status: "cancelled", cancelledFrom: "uploading" }), ["fresh"]);
  assert.deepEqual(recoveryActions({ status: "cancelled", mediaType: "video/mp4", cancelledFrom: "processing" }), ["restart"]);
  for (const status of ["analyzed", "failed"]) assert.deepEqual(recoveryActions({ status }), []);
  assert.equal(shouldPollAnalyses([{ status: "cancelled" }]), false);
});

test("a saved session requires an explicit choice and checks current server state", async () => {
  const file = { name: "shelf.mp4", size: 100 };
  const saved = { analysisId: "a", uri: "https://example.test/session" };
  const analysis = { analysisId: "a", fileName: file.name, status: "uploading" };
  const calls = [];
  const api = async (...args) => { calls.push(args); return { analysis }; };
  assert.deepEqual(await prepareVideoRecovery(file, null, saved, api), { needsChoice: analysis });
  assert.deepEqual(await prepareVideoRecovery(file, { mode: "resume", analysis }, saved, api), { session: saved });
  assert.ok(calls.every(([method]) => method === "GET"));
  await assert.rejects(prepareVideoRecovery(file, { mode: "resume", analysis }, null, api), /Start fresh/);
  await assert.rejects(prepareVideoRecovery({ ...file, name: "other.mp4" }, { mode: "resume", analysis }, saved, api), /original video/);
  const terminal = async () => ({ analysis: { ...analysis, status: "cancelled" } });
  assert.deepEqual(await prepareVideoRecovery(file, null, saved, terminal), { session: null });
  await assert.rejects(prepareVideoRecovery(file, { mode: "resume", analysis }, saved, terminal), /no longer resumable/);
});

test("plain Storage failures become safe actionable reason codes", () => {
  assert.equal(safeStorageCode(
    "Invalid request. The Content-Range header is invalid for this upload."),
  "content_range_invalid");
  assert.equal(safeStorageCode(
    "Invalid request. There were fewer bytes in the request body than expected."),
  "content_length_mismatch");
  assert.equal(safeStorageCode("private unexplained failure"), null);
});

test("a new resumable session starts without an unnecessary status probe", async () => {
  const calls = [];
  const file = { size: 1024, slice: (start, end) => ({ start, end }) };
  await uploadVideoChunks(file, "https://storage.invalid/session", () => {},
    async (_uri, options) => {
      calls.push(options);
      return { status: 200, headers: new Headers() };
    }, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers["Content-Range"], "bytes 0-1023/1024");
});

test("retrying a failed refinement resends that run's own note", () => {
  const analysis = {
    status: "failed",
    runs: [
      { runNumber: 1, context: null, status: "analyzed" },
      { runNumber: 2, context: "ignore the top shelf", status: "failed" }
    ]
  };
  assert.equal(retryContextOf(analysis), "ignore the top shelf",
    "a retry that drops the note silently asks a different question");
});

test("retrying a failed first run resends no note, because it carried none", () => {
  const analysis = {
    status: "failed",
    runs: [{ runNumber: 1, context: null, status: "failed" }]
  };
  assert.equal(retryContextOf(analysis), null);
});

test("a record with no run history yet retries with no note", () => {
  assert.equal(retryContextOf({ status: "failed", runs: [] }), null);
  assert.equal(retryContextOf({ status: "uploaded" }), null);
  assert.equal(retryContextOf(undefined), null);
});

test("a blank refinement is refused rather than sent as a bodyless rerun", () => {
  for (const blank of ["", "   ", "\t\n ", null, undefined, 42]) {
    assert.equal(refinementNote(blank), null,
      `${JSON.stringify(blank)} must not become a run`);
  }
});

test("a real refinement note is trimmed and kept", () => {
  assert.equal(refinementNote("  count the boxes behind  "), "count the boxes behind");
});

test("a note longer than the server ceiling is refused before the call", () => {
  assert.equal(refinementNote("x".repeat(501)), null);
  assert.equal(refinementNote("x".repeat(500)), "x".repeat(500));
});

test("a Firebase sign-in code never reaches the page; wrong email and wrong password read the same", () => {
  const wrongEmail = signInErrorMessage("auth/user-not-found");
  assert.equal(signInErrorMessage("auth/wrong-password"), wrongEmail);
  assert.equal(signInErrorMessage("auth/invalid-credential"), wrongEmail);
  for (const code of ["auth/invalid-email", "auth/too-many-requests", "auth/user-disabled",
    "auth/network-request-failed", "auth/popup-closed-by-user", "auth/something-new", undefined]) {
    const message = signInErrorMessage(code);
    assert.ok(message.length > 0 && !message.includes("auth/"), `${code}: ${message}`);
  }
});

test("only a popup that could not run falls back to the redirect path", () => {
  assert.equal(shouldFallBackToRedirect("auth/popup-blocked"), true);
  assert.equal(shouldFallBackToRedirect("auth/popup-closed-by-user"), true);
  assert.equal(shouldFallBackToRedirect("auth/cancelled-popup-request"), true);
  assert.equal(shouldFallBackToRedirect("auth/network-request-failed"), false);
  assert.equal(shouldFallBackToRedirect("auth/user-disabled"), false);
  assert.equal(shouldFallBackToRedirect(undefined), false);
});
