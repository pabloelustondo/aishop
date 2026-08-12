import assert from "node:assert/strict";
import test from "node:test";
import { ClientError } from "../src/errors.js";
import { authenticateCustomer } from "../src/customer-auth.js";

test("rejects a missing or malformed authorization header", async () => {
  await assert.rejects(
    authenticateCustomer(undefined, async () => ({ uid: "customer-1" })),
    ClientError
  );
  await assert.rejects(
    authenticateCustomer("token", async () => ({ uid: "customer-1" })),
    ClientError
  );
});

test("rejects a token that fails verification", async () => {
  await assert.rejects(
    authenticateCustomer("Bearer bad-token", async () => { throw new Error("invalid"); }),
    ClientError
  );
});

test("rejects a verified token with no uid", async () => {
  await assert.rejects(
    authenticateCustomer("Bearer token", async () => ({})),
    ClientError
  );
});

test("returns the verified uid as ownerId", async () => {
  const identity = await authenticateCustomer(
    "Bearer good-token",
    async (token) => {
      assert.equal(token, "good-token");
      return { uid: "customer-1" };
    }
  );
  assert.deepEqual(identity, { ownerId: "customer-1" });
});
