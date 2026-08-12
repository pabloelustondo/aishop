import assert from "node:assert/strict";
import test from "node:test";
import {
  createFirebaseVistaTokenVerifier
} from "../src/firebase-vista-token-verifier.js";

test("VISTA Firebase verification checks token revocation", async () => {
  const calls = [];
  const verifier = createFirebaseVistaTokenVerifier({
    async verifyIdToken(...values) { calls.push(values); return { uid: "owner" }; }
  });
  assert.deepEqual(await verifier("token"), { uid: "owner" });
  assert.deepEqual(calls, [["token", true]]);
});
