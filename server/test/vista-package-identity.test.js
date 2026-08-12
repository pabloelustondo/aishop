import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticateVistaOwner,
  normalizeVistaRunId
} from "../src/vista-package-identity.js";

test("derives the owner key only from the verified Firebase uid", async () => {
  const owner = await authenticateVistaOwner(
    "Bearer valid-token",
    async (token) => {
      assert.equal(token, "valid-token");
      return { uid: "vista-fixture-firebase-uid" };
    }
  );
  assert.deepEqual(owner, {
    ownerKey: "a77417321dde97958dd3349a2b98a12d2ddbc8d286b4d293a7d24102a7a33224"
  });
});

test("rejects unverified identity without exposing the token", async () => {
  const token = "secret-token-that-must-not-escape";
  const invalid = new Error(token);
  invalid.code = "auth/invalid-id-token";
  await assert.rejects(
    authenticateVistaOwner(`Bearer ${token}`, async () => { throw invalid; }),
    (error) => error.code === "unauthorized" && !error.message.includes(token)
  );
});

test("rejects a verified token without a non-empty uid", async () => {
  for (const identity of [{}, { uid: "" }, { uid: 42 }]) {
    await assert.rejects(
      authenticateVistaOwner("Bearer token", async () => identity),
      (error) => error.code === "unauthorized"
    );
  }
});

test("normalizes UUID case and rejects non-UUID run ids", () => {
  assert.equal(
    normalizeVistaRunId("2C11D24C-86DA-4AE9-9BE4-D67308E27389"),
    "2c11d24c-86da-4ae9-9be4-d67308e27389"
  );
  assert.equal(normalizeVistaRunId("not-a-uuid"), null);
});
