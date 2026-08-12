// Step 03 (happy path): after a successful upload, everything the
// receipt promises really exists — the database record says "received"
// with the same receipt, and the stored files are byte-identical to
// what the client sent.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fixture, hash, request } from "../../server/test-support/vista-package-fixture.js";
import { mintEmulatorUser } from "./emulator-auth.mjs";
import { downloadObject, getRunRecord, listRunObjects, plain } from "./emulator-state.mjs";

const base = process.env.VISTA_E2E_FUNCTION_URL ??
  "http://127.0.0.1:5001/demo-aishop-e2e/northamerica-northeast2/api";
const BUCKETS = ["demo-aishop-e2e.appspot.com",
  "demo-aishop-e2e.firebasestorage.app"];

const { idToken, uid } = await mintEmulatorUser();
const spec = request();
const response = await fetch(base + spec.url, { method: "POST",
  headers: { ...spec.headers, authorization: `Bearer ${idToken}` },
  body: spec.rawBody });
const receipt = await response.json();
assert.equal(response.status, 201, JSON.stringify(receipt));

const ownerKey = createHash("sha256").update(uid, "utf8").digest("hex");
const runId = receipt.runId.toLowerCase();

const record = await getRunRecord(ownerKey, runId);
assert.equal(plain(record.fields.status), "received");
const stored = plain(record.fields.receipt);
assert.equal(stored.receiptId, receipt.receiptId);
assert.equal(stored.manifestSha256, receipt.manifestSha256);

const prefix = `vista/inspection-packages/${ownerKey}/${runId}/`;
let names = null;
for (const bucket of BUCKETS) {
  names = await listRunObjects(bucket, prefix);
  if (names?.length) {
    assert.equal(names.length, 3, `objects: ${JSON.stringify(names)}`);
    const jpegName = `${prefix}artifacts/${hash(fixture.jpeg)}`;
    assert.ok(names.includes(jpegName), "stored JPEG path must be its hash");
    assert.ok(names.includes(`${prefix}manifest/${receipt.manifestSha256}.json`));
    const bytes = await downloadObject(bucket, jpegName);
    assert.ok(bytes.equals(fixture.jpeg), "stored JPEG must be byte-identical");
    break;
  }
}
assert.ok(names?.length, "no stored objects found in any candidate bucket");
console.log("PASS step-03: receipt, database record, and stored bytes all agree.");
