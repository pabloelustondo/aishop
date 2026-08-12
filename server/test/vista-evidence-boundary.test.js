import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { vistaEvidenceObjects } from "../src/vista-evidence-objects.js";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const base = { ownerKey: "a".repeat(64),
  runId: "00000000-0000-4000-8000-000000000001",
  manifestBytes: Buffer.from("{}"), manifestSha256: sha256(Buffer.from("{}")) };

test("evidence paths accept only a recomputed verified artifact hash", () => {
  const bytes = Buffer.from("artifact");
  assert.throws(() => vistaEvidenceObjects({ ...base, artifacts: [{ bytes,
    mediaType: "image/jpeg", sha256: "../../client-path" }] }),
  (error) => error.code === "evidence_persistence_unavailable");
  assert.throws(() => vistaEvidenceObjects({ ...base, artifacts: [{ bytes,
    mediaType: "image/jpeg", sha256: "b".repeat(64) }] }),
  (error) => error.code === "evidence_persistence_unavailable");
});

test("manifest object requires the recomputed exact manifest hash", () => {
  assert.throws(() => vistaEvidenceObjects({ ...base,
    manifestSha256: "b".repeat(64), artifacts: [] }),
  (error) => error.code === "evidence_persistence_unavailable");
});
