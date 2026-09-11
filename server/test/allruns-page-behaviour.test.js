/** The All-runs page's decisions, tested as pure functions (see agent-page-behaviour.test.js). */
import assert from "node:assert/strict";
import test from "node:test";
import { attemptLine, ownerText, queryString, signInErrorMessage } from "../../dashboard/scripts/allruns.js";

test("only filters with a value travel, trimmed, and the cursor rides with them", () => {
  assert.equal(queryString({}), "");
  assert.equal(queryString({ owner: "  ", status: "", from: "", to: "", limit: "" }), "");
  assert.equal(queryString({ owner: " abc ", status: "failed", limit: 10, cursor: "c+/=" }),
    "?owner=abc&status=failed&limit=10&cursor=c%2B%2F%3D");
  assert.equal(queryString({ from: "2026-09-01", to: "2026-09-10" }), "?from=2026-09-01&to=2026-09-10");
});

test("an attempt is described the way My runs describes it, with nothing invented", () => {
  assert.deepEqual(attemptLine({ runNumber: 2, context: "ignore the top shelf", status: "failed", failureReason: "provider_timeout" }, 1),
    { number: "Run 2", asked: "“ignore the top shelf”", outcome: "failed · provider_timeout" });
  assert.deepEqual(attemptLine({ status: "analyzed" }, 0), { number: "Run 1", asked: "no note — initial run", outcome: "analyzed" });
  assert.deepEqual(attemptLine({}, 3), { number: "Run 4", asked: "no note", outcome: "status unavailable" });
});

test("an owner is a label, or one of two plain words — never a key", () => {
  assert.equal(ownerText({ label: "a@example.com", kind: "email" }), "a@example.com");
  assert.equal(ownerText({ label: "Pablo", kind: "google" }), "Pablo");
  assert.equal(ownerText({ label: null, kind: "anonymous" }), "anonymous account");
  assert.equal(ownerText({ label: null, kind: "unresolved" }), "unresolved owner");
  assert.equal(ownerText(undefined), "unresolved owner");
});

test("sign-in wording matches the agent page's: no Firebase code reaches a person", () => {
  for (const code of ["auth/wrong-password", "auth/user-not-found", "auth/invalid-credential", "auth/nope", undefined]) {
    assert.ok(!signInErrorMessage(code).includes("auth/"));
  }
});
