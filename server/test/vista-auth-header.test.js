import assert from "node:assert/strict";
import test from "node:test";
import { authenticateVistaOwner } from "../src/vista-package-identity.js";

test("malformed bearer headers are rejected without calling Firebase", async () => {
  let calls = 0;
  const verifier = async () => { calls += 1; return { uid: "owner" }; };
  const headers = [undefined, 42, "", "Basic token", "Bearer", "Bearer ",
    "Bearer  token", "Bearer token extra", "bearer token"];
  for (const header of headers) {
    await assert.rejects(authenticateVistaOwner(header, verifier),
      (error) => error.code === "unauthorized");
  }
  assert.equal(calls, 0);
});
