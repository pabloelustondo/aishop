// Step 04 (agent upload path): a browser-shaped multipart upload reaches
// storage and Firestore, the run endpoint settles the record either way,
// a second caller cannot see any of it, and the stored bytes are the
// bytes that were sent.
//
// What this step does NOT prove: that a run returns named products with
// counts. The emulators have no OpenAI credential, so the run settles as
// `failed` with a provider reason. That is itself the guarantee worth
// gating on — a run never vanishes silently — but the happy answer is
// only observable against a real key, and this step says so rather than
// implying otherwise.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mintEmulatorUser } from "./emulator-auth.mjs";
import { downloadObject, listRunObjects, plain } from "./emulator-state.mjs";

const base = process.env.VISTA_E2E_FUNCTION_URL ??
  "http://127.0.0.1:5001/demo-aishop-e2e/northamerica-northeast2/api";
const BASE = "/v1/agent/analyses";
const BUCKETS = ["demo-aishop-e2e.appspot.com",
  "demo-aishop-e2e.firebasestorage.app"];
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const PROJECT = "demo-aishop-e2e";
const BOUNDARY = "----agente2eboundary";

const JPEG = readFileSync(new URL(
  "../../server/contracts/vista-server-endpoint-agent-handoff-v0.1/" +
  "fixtures/valid/accepted-detail.jpg", import.meta.url));

const ownerKeyOf = (uid) => createHash("sha256").update(uid, "utf8").digest("hex");

function multipartBody(bytes, filename = "shelf.jpg", type = "image/jpeg") {
  return Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="file";` +
      ` filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`)
  ]);
}

const call = (idToken, method, path, body, contentType) => fetch(base + path, {
  method,
  headers: {
    authorization: `Bearer ${idToken}`,
    ...(contentType ? { "content-type": contentType } : {})
  },
  body
});

async function analysisRecord(ownerKey, analysisId) {
  const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/` +
    `(default)/documents/agentAnalyses/${ownerKey}/analyses/${analysisId}`;
  const response = await fetch(url, { headers: { authorization: "Bearer owner" } });
  if (!response.ok) throw new Error(`Firestore emulator read failed: ${response.status}`);
  return (await response.json()).fields;
}

// --- upload ----------------------------------------------------------------
const { idToken, uid } = await mintEmulatorUser();
const ownerKey = ownerKeyOf(uid);

const uploaded = await call(idToken, "POST", BASE, multipartBody(JPEG),
  `multipart/form-data; boundary=${BOUNDARY}`);
const created = await uploaded.json();
assert.equal(uploaded.status, 201, JSON.stringify(created));
assert.equal(uploaded.headers.get("cache-control"), "no-store");

const { analysisId } = created.analysis;
assert.equal(created.analysis.status, "uploaded");
assert.equal(created.analysis.sha256,
  createHash("sha256").update(JPEG).digest("hex"),
  "the acknowledged digest must describe the bytes that were sent");

// --- the bytes are really there, unchanged ---------------------------------
const prefix = `agent/analyses/${ownerKey}/${analysisId}/`;
let storedNames = null;
for (const bucket of BUCKETS) {
  storedNames = await listRunObjects(bucket, prefix);
  if (storedNames?.length) {
    assert.deepEqual(storedNames, [`${prefix}source`]);
    const bytes = await downloadObject(bucket, `${prefix}source`);
    assert.ok(bytes.equals(JPEG), "the stored source must be byte-identical");
    break;
  }
}
assert.ok(storedNames?.length, "no stored source object found in any candidate bucket");

// --- the record exists and holds descriptors, never bytes ------------------
const record = await analysisRecord(ownerKey, analysisId);
assert.equal(plain(record.status), "uploaded");
assert.equal(plain(record.ownerKey), ownerKey);
assert.deepEqual(plain(record.runs), [], "no run has been attempted yet");
for (const forbidden of ["bytes", "imageBase64", "source"]) {
  assert.ok(!Object.hasOwn(record, forbidden), `${forbidden} must not be in Firestore`);
}

// --- run: settles, either way, and is never lost ---------------------------
const ran = await call(idToken, "POST", `${BASE}/${analysisId}/run`);
const runBody = await ran.json();
const settled = await analysisRecord(ownerKey, analysisId);
const status = plain(settled.status);
assert.ok(["analyzed", "failed"].includes(status),
  `a run must settle, not linger: ${status}`);
const runs = plain(settled.runs);
assert.equal(runs.length, 1, "the attempt is recorded whether or not it succeeded");
assert.equal(runs[0].context, null, "an automatic first run carries no note");
assert.equal(runs[0].status, status);
if (status === "failed") {
  assert.ok(plain(settled.failureReason), "a failed run must say why");
  assert.ok([502, 504].includes(ran.status), `provider failure status: ${ran.status}`);
  assert.equal(runBody.error.retryable, true);
} else {
  assert.equal(ran.status, 200);
  assert.ok(Array.isArray(runBody.analysis.report.identifiedProducts));
}

// --- a refine sends a note, and the note is recorded with its run ----------
const refined = await call(idToken, "POST", `${BASE}/${analysisId}/run`,
  JSON.stringify({ context: "ignore the top shelf" }), "application/json");
await refined.text();
const afterRefine = plain((await analysisRecord(ownerKey, analysisId)).runs);
assert.equal(afterRefine.length, 2, "a refine opens its own run, it does not replace one");
assert.equal(afterRefine[1].context, "ignore the top shelf");
assert.equal(afterRefine[0].context, null, "the earlier run keeps its own history");

// --- a note the server will not accept costs nothing -----------------------
const tooLong = await call(idToken, "POST", `${BASE}/${analysisId}/run`,
  JSON.stringify({ context: "x".repeat(2_000) }), "application/json");
assert.equal(tooLong.status, 400);
assert.equal((await tooLong.json()).error.code, "context_invalid");
assert.equal(plain((await analysisRecord(ownerKey, analysisId)).runs).length, 2,
  "a refused note must not open a run");

// --- read and list are the caller's own -----------------------------------
const read = await call(idToken, "GET", `${BASE}/${analysisId}`);
const readBody = await read.json();
assert.equal(read.status, 200);
assert.equal(readBody.analysis.analysisId, analysisId);
assert.equal(typeof readBody.analysis.createdAt, "string",
  "timestamps leave as ISO strings, not Firestore internals");

const listed = await (await call(idToken, "GET", BASE)).json();
assert.ok(listed.analyses.some((one) => one.analysisId === analysisId));

// --- a second caller sees nothing, and can neither read nor run it ---------
const other = await mintEmulatorUser();
const theirList = await (await call(other.idToken, "GET", BASE)).json();
assert.deepEqual(theirList.analyses, [], "a new caller's list must be empty");

const theirRead = await call(other.idToken, "GET", `${BASE}/${analysisId}`);
assert.equal(theirRead.status, 404, "another owner's analysis is simply not there");

const theirRun = await call(other.idToken, "POST", `${BASE}/${analysisId}/run`);
assert.equal(theirRun.status, 404);
assert.equal(plain((await analysisRecord(ownerKey, analysisId)).runs).length, 2,
  "a stranger's request must not touch the record");

// --- an unauthenticated caller gets nowhere -------------------------------
const anonymous = await fetch(`${base}${BASE}`);
assert.equal(anonymous.status, 401);

// --- rejected uploads cost no storage -------------------------------------
const notJpeg = await call(idToken, "POST", BASE,
  multipartBody(Buffer.from("this is not a jpeg")),
  `multipart/form-data; boundary=${BOUNDARY}`);
assert.equal(notJpeg.status, 400);
assert.equal((await notJpeg.json()).error.code, "file_not_jpeg");

const wrongType = await call(idToken, "POST", BASE,
  multipartBody(JPEG, "shelf.png", "image/png"),
  `multipart/form-data; boundary=${BOUNDARY}`);
assert.equal(wrongType.status, 415);

const mine = await (await call(idToken, "GET", BASE)).json();
assert.equal(mine.analyses.length, 1, "a refused upload must not create a record");

console.log(`PASS step-04: agent upload, run (${status}), refine, read, and`
  + " owner isolation all hold. The analysed-with-counts answer is not"
  + " covered here — it needs a real provider credential.");
