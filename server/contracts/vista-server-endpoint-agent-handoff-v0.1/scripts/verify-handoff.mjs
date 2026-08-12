import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const bundleRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const validRoot = join(bundleRoot, "fixtures", "valid");
const invalidRoot = join(bundleRoot, "fixtures", "invalid");

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function bytes(relativePath) {
  return readFileSync(join(bundleRoot, relativePath));
}

function json(relativePath) {
  return JSON.parse(bytes(relativePath).toString("utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function canonicalJSON(value) {
  return JSON.stringify(stableValue(value));
}

function sameKeys(value, expected) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort())
  );
}

const shaPattern = /^[0-9a-f]{64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const utcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const manifestKeys = [
  "schemaVersion",
  "runId",
  "runKind",
  "completedAt",
  "versions",
  "context",
  "terminalChainHash",
  "sealedManifest",
  "artifacts",
];
const versionKeys = [
  "app",
  "osVersion",
  "device",
  "model",
  "catalog",
  "policy",
  "profileVersion",
  "scenario",
];
const contextKeys = ["visitId", "storeId", "assignmentId", "targetAreaId"];
const artifactKeys = ["id", "kind", "mediaType", "sha256", "byteCount", "captureId"];

function manifestErrors(manifest) {
  const errors = [];
  if (!sameKeys(manifest, manifestKeys)) errors.push("top-level keys");
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion");
  if (!uuidPattern.test(manifest.runId ?? "")) errors.push("runId");
  if (manifest.runKind !== "inspection") errors.push("runKind");
  if (!utcPattern.test(manifest.completedAt ?? "")) errors.push("completedAt");
  if (!sameKeys(manifest.versions, versionKeys)) errors.push("versions keys");
  if (!sameKeys(manifest.context, contextKeys)) errors.push("context keys");
  if (!shaPattern.test(manifest.terminalChainHash ?? "")) errors.push("terminalChainHash");
  if (!shaPattern.test(manifest.sealedManifest ?? "")) errors.push("sealedManifest");
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length < 2 || manifest.artifacts.length > 100) {
    errors.push("artifact count");
    return errors;
  }

  const ids = new Set();
  const descriptorsByHash = new Map();
  let audits = 0;
  let images = 0;
  for (const artifact of manifest.artifacts) {
    if (!sameKeys(artifact, artifactKeys)) errors.push("artifact keys");
    if (!artifact.id || ids.has(artifact.id)) errors.push("artifact id uniqueness");
    ids.add(artifact.id);
    if (!shaPattern.test(artifact.sha256 ?? "")) errors.push("artifact sha256");
    if (!Number.isInteger(artifact.byteCount) || artifact.byteCount < 1) errors.push("artifact byteCount");
    if (artifact.kind === "audit/events") {
      audits += 1;
      if (artifact.mediaType !== "application/json" || artifact.captureId !== null) {
        errors.push("audit descriptor");
      }
    } else if (["image/globalStill", "image/detailStill"].includes(artifact.kind)) {
      images += 1;
      if (artifact.mediaType !== "image/jpeg" || typeof artifact.captureId !== "string" || !artifact.captureId) {
        errors.push("image descriptor");
      }
    } else {
      errors.push("artifact kind");
    }

    const previous = descriptorsByHash.get(artifact.sha256);
    if (previous && (previous.mediaType !== artifact.mediaType || previous.byteCount !== artifact.byteCount)) {
      errors.push("inconsistent repeated hash descriptor");
    }
    descriptorsByHash.set(artifact.sha256, artifact);
  }
  if (audits !== 1) errors.push("audit count");
  if (images < 1) errors.push("image count");
  return [...new Set(errors)];
}

for (const name of ["manifest-v1.schema.json", "receipt-v1.schema.json", "error-v1.schema.json"]) {
  const schema = json(`schemas/${name}`);
  assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", `${name}: draft`);
}

const manifestBytes = readFileSync(join(validRoot, "manifest.json"));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
assert(manifestErrors(manifest).length === 0, `manifest: ${manifestErrors(manifest).join(", ")}`);

const filesByHash = new Map();
for (const name of ["audit-transport.json", "accepted-detail.jpg"]) {
  const value = readFileSync(join(validRoot, name));
  filesByHash.set(sha256(value), { name, value });
}
const declaredHashes = new Set(manifest.artifacts.map((artifact) => artifact.sha256));
assert(declaredHashes.size === filesByHash.size, "unique declared/uploaded artifact-set size");
for (const artifact of manifest.artifacts) {
  const actual = filesByHash.get(artifact.sha256);
  assert(actual, `missing fixture bytes for ${artifact.sha256}`);
  assert(actual.value.length === artifact.byteCount, `${actual.name}: byte count`);
}

const jpeg = readFileSync(join(validRoot, "accepted-detail.jpg"));
assert(jpeg[0] === 0xff && jpeg[1] === 0xd8, "JPEG SOI marker");
assert(jpeg.at(-2) === 0xff && jpeg.at(-1) === 0xd9, "JPEG EOI marker");

const records = JSON.parse(readFileSync(join(validRoot, "audit-transport.json"), "utf8"));
assert(Array.isArray(records) && records.length >= 3, "audit record count");
let previousHash = "0".repeat(64);
let previousSeq = -1;
for (const record of records) {
  assert(record.previousHash === previousHash, "audit previousHash");
  assert(record.event.seq === previousSeq + 1, "audit sequence");
  assert(record.event.runID.toLowerCase() === manifest.runId.toLowerCase(), "audit run ID");
  assert(record.event.runKind === "inspection", "audit run kind");
  const expected = sha256(`${previousHash}${canonicalJSON(record.event)}`);
  assert(record.chainHash === expected, "audit chain hash");
  previousHash = record.chainHash;
  previousSeq = record.event.seq;
}
assert(records.at(-1).event.name === "session.runCompleted", "terminal event");
assert(previousHash === manifest.terminalChainHash, "terminal chain hash");

const referencedHashes = [...new Set(records.flatMap((record) =>
  record.event.artifacts.map((artifact) => artifact.sha256),
))].sort();
const expectedSealedManifest = sha256(
  `manifest:${manifest.terminalChainHash}:${referencedHashes.join(",")}`,
);
assert(manifest.sealedManifest === expectedSealedManifest, "sealed C07 manifest");
for (const artifact of manifest.artifacts.filter((value) => value.kind.startsWith("image/"))) {
  assert(referencedHashes.includes(artifact.sha256), "image referenced by audit chain");
}

const manifestSha256 = sha256(manifestBytes);
const receipt = JSON.parse(readFileSync(join(validRoot, "receipt.json"), "utf8"));
assert(receipt.manifestSha256 === manifestSha256, "receipt manifest hash");
assert(receipt.runId.toLowerCase() === manifest.runId.toLowerCase(), "receipt run ID");
const acceptedHashes = [...filesByHash.keys()].sort();
assert(JSON.stringify(receipt.artifactSha256) === JSON.stringify(acceptedHashes), "receipt artifact set/order");
assert(receipt.analysisStatus === "notRequested", "receipt analysis status");

const metadata = JSON.parse(readFileSync(join(validRoot, "request-metadata.json"), "utf8"));
assert(metadata.headers["Idempotency-Key"] === manifest.runId, "idempotency key spelling");
assert(metadata.headers["X-Vista-Manifest-SHA256"] === manifestSha256, "metadata manifest hash");
assert(metadata.multipart[0].byteCount === manifestBytes.length, "metadata manifest length");
assert(metadata.multipart[0].filename === "manifest.json", "metadata manifest filename");
for (const part of metadata.multipart.slice(1)) {
  assert(
    part.filename === `${part.sha256}${part.mediaType === "application/json" ? ".json" : ".jpg"}`,
    "metadata artifact filename",
  );
}

const persistence = JSON.parse(readFileSync(join(validRoot, "expected-persistence.json"), "utf8"));
assert(
  persistence.ownerKey === sha256(Buffer.from(persistence.fixtureFirebaseUid, "utf8")),
  "persistence owner key",
);
assert(persistence.packageRecord.runId === manifest.runId.toLowerCase(), "persistence run ID");
assert(persistence.packageRecord.manifestSha256 === manifestSha256, "persistence manifest hash");
assert(persistence.packageRecord.receiptId === receipt.receiptId, "persistence receipt ID");
for (const object of persistence.storageObjects) {
  const source = readFileSync(join(validRoot, object.sourceFile));
  assert(source.length === object.byteCount, `${object.sourceFile}: persisted byte count`);
  assert(sha256(source) === object.sha256, `${object.sourceFile}: persisted hash`);
  assert(object.public === false && object.createOnly === true, `${object.sourceFile}: privacy/immutability`);
}

const expectedErrors = json("fixtures/invalid/expected-errors.json");
for (const name of ["manifest-extra-owner.json", "manifest-wrong-run-kind.json"]) {
  assert(expectedErrors[name] === "manifest_invalid", `${name}: expected code`);
  assert(manifestErrors(json(`fixtures/invalid/${name}`)).length > 0, `${name}: must be invalid`);
}

console.log("PASS: schemas parse and the golden fixture is internally consistent.");
console.log(`manifestSha256=${manifestSha256}`);
console.log(`terminalChainHash=${manifest.terminalChainHash}`);
console.log(`sealedManifest=${manifest.sealedManifest}`);
console.log(`artifactSha256=${acceptedHashes.join(",")}`);
