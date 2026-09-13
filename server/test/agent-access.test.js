import assert from "node:assert/strict";
import test from "node:test";
import {
  describe, execute, nextClaims, parseArguments, UsageError
} from "../scripts/agent-access.mjs";

test("refuses to run without an explicit project", () => {
  assert.throws(() => parseArguments(["grant", "a@example.com"]), UsageError);
  assert.throws(() => parseArguments(["grant", "a@example.com", "--project", "Bad Project"]), UsageError);
  assert.deepEqual(parseArguments(["show", "a@example.com", "--project", "demo-aishop-e2e"]),
    { action: "show", subject: "a@example.com", role: "agent", project: "demo-aishop-e2e" });
});

test("only the two roles and three actions exist; a flag is never a subject", () => {
  assert.throws(() => parseArguments(["delete", "a@example.com", "--project", "demo-aishop-e2e"]), UsageError);
  assert.throws(() => parseArguments(["grant", "--project", "demo-aishop-e2e"]), UsageError);
  assert.throws(() => parseArguments(["grant", "uid", "--project", "demo-aishop-e2e", "--role", "root"]), UsageError);
  assert.equal(parseArguments(["grant", "uid", "--project", "demo-aishop-e2e", "--role", "admin"]).role, "admin");
});

test("a grant adds exactly one key and a revoke removes exactly one; other claims survive", () => {
  assert.deepEqual(nextClaims({ reviewer: true }, "agent", "grant"), { reviewer: true, agent: true });
  assert.deepEqual(nextClaims({ reviewer: true, agent: true, admin: true }, "agent", "revoke"),
    { reviewer: true, admin: true });
  assert.deepEqual(nextClaims(undefined, "admin", "grant"), { admin: true });
});

test("the description shows the managed claims as booleans and nothing that could be a secret", () => {
  assert.deepEqual(describe({ uid: "u1", customClaims: { agent: "true", reviewer: true } }),
    { uid: "u1", disabled: false, claims: { agent: false, admin: false } });
});

test("execute resolves by email or uid, writes the merged claims, and revokes sessions on revoke", async () => {
  const calls = [];
  const users = { u1: { uid: "u1", email: "a@example.com", customClaims: { reviewer: true } } };
  const auth = {
    getUserByEmail: async (email) => { calls.push(["byEmail"]); return users.u1; },
    getUser: async (uid) => { calls.push(["get", uid]); return users[uid]; },
    setCustomUserClaims: async (uid, claims) => { calls.push(["set", uid, claims]); users[uid].customClaims = claims; },
    revokeRefreshTokens: async (uid) => { calls.push(["revoke", uid]); }
  };
  const granted = await execute(parseArguments(["grant", "a@example.com", "--project", "demo-aishop-e2e"]), auth);
  assert.deepEqual(granted.claims, { agent: true, admin: false });
  assert.deepEqual(calls.filter(([c]) => c === "set")[0], ["set", "u1", { reviewer: true, agent: true }]);
  assert.ok(!calls.some(([c]) => c === "revoke"), "a grant does not sign anyone out");

  calls.length = 0;
  const revoked = await execute(parseArguments(["revoke", "u1", "--project", "demo-aishop-e2e"]), auth);
  assert.deepEqual(revoked.claims, { agent: false, admin: false });
  assert.deepEqual(calls[0], ["get", "u1"]);
  assert.deepEqual(calls.find(([c]) => c === "set"), ["set", "u1", { reviewer: true }]);
  assert.deepEqual(calls.find(([c]) => c === "revoke"), ["revoke", "u1"]);
});
