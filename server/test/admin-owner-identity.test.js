import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createOwnerIdentityResolver, describeAccount, UNRESOLVED } from "../src/admin-owner-identity.js";

const key = (uid) => createHash("sha256").update(uid).digest("hex");

test("an account becomes a label and a kind, and never its uid", () => {
  assert.deepEqual(describeAccount({ uid: "u", email: "a@example.com", providerData: [{ providerId: "password" }] }),
    { label: "a@example.com", kind: "email" });
  assert.deepEqual(describeAccount({ uid: "u", displayName: "Pablo", providerData: [{ providerId: "google.com" }] }),
    { label: "Pablo", kind: "google" });
  assert.deepEqual(describeAccount({ uid: "u", providerData: [] }), { label: null, kind: "anonymous" });
  assert.deepEqual(describeAccount({ uid: "u", providerData: [{ providerId: "phone" }] }), { label: null, kind: "unresolved" });
  assert.ok(!JSON.stringify(describeAccount({ uid: "SECRET-UID", email: "a@example.com" })).includes("SECRET"));
});

test("resolves by hashing every listed uid, walks pages, and caches the walk", async () => {
  let calls = 0;
  const auth = { listUsers: async (max, token) => {
    calls += 1;
    return token ? { users: [{ uid: "u2", providerData: [] }] }
      : { users: [{ uid: "u1", email: "one@example.com" }], pageToken: "next" };
  } };
  let clock = 0;
  const resolver = createOwnerIdentityResolver({ auth, now: () => clock, cacheMs: 100 });
  assert.deepEqual(await resolver.labelFor(key("u1")), { label: "one@example.com", kind: "email" });
  assert.deepEqual(await resolver.labelFor(key("u2")), { label: null, kind: "anonymous" });
  assert.deepEqual(await resolver.labelFor(key("nobody")), UNRESOLVED);
  assert.equal(calls, 2, "two pages, walked once");
  clock = 101;
  await resolver.labelFor(key("u1"));
  assert.equal(calls, 4, "the cache expired and the walk ran again");
});

test("concurrent first requests share one walk; a directory failure is unresolved, not an error", async () => {
  let calls = 0;
  const auth = { listUsers: async () => { calls += 1; await new Promise((r) => setTimeout(r, 5)); return { users: [{ uid: "u1", email: "e@example.com" }] }; } };
  const resolver = createOwnerIdentityResolver({ auth });
  const [a, b] = await Promise.all([resolver.labelFor(key("u1")), resolver.labelsFor([key("u1"), key("x")])]);
  assert.equal(a.kind, "email");
  assert.deepEqual(b[key("x")], UNRESOLVED);
  assert.equal(calls, 1);

  const failing = createOwnerIdentityResolver({ auth: { listUsers: async () => { throw new Error("auth down"); } } });
  assert.deepEqual(await failing.labelFor(key("u1")), UNRESOLVED);
});
