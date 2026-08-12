import assert from "node:assert/strict";
import test from "node:test";
import { createOrVerifyObject } from "../src/vista-create-only-object.js";

test("maps provider-coded existing-object read failures to stable 503", async () => {
  const bucket = { file: () => ({ async save() {
    const error = new Error("exists"); error.code = 412; throw error;
  }, async download() {
    const error = new Error("provider details"); error.code = 404; throw error;
  }, async getMetadata() { return [{}]; } }) };
  const specification = { path: "safe", bytes: Buffer.from("[]"),
    mediaType: "application/json", sha256:
      "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e0a76a0f1c2ed4f8a86722b",
    shared: { ownerKey: "a".repeat(64),
      runId: "00000000-0000-4000-8000-000000000001",
      manifestSha256: "b".repeat(64) } };
  await assert.rejects(createOrVerifyObject(bucket, specification), (error) =>
    error.code === "evidence_persistence_unavailable" && error.status === 503);
});
