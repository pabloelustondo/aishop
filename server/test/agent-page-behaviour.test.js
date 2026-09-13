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
import test from "node:test";
import {
  retryContextOf, refinementNote, signInErrorMessage, shouldFallBackToRedirect
} from "../../dashboard/scripts/agent.js";

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
