import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const bundleRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureRoot = join(bundleRoot, "fixtures", "valid");
const invalidFixtureRoot = join(bundleRoot, "fixtures", "invalid");

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

function prettyJSON(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeUTF8(name, value) {
  writeFileSync(join(fixtureRoot, name), value, "utf8");
}

const runId = "2C11D24C-86DA-4AE9-9BE4-D67308E27389";
const captureId = "CA1279DB-254B-4520-9681-82C905C80DD6";
const artifactId = "94E71966-B393-4B6D-953A-6929633C31BE";
const jpegBytes = readFileSync(join(fixtureRoot, "accepted-detail.jpg"));
const jpegSha256 = sha256(jpegBytes);
const jpegByteCount = jpegBytes.length;
const versions = {
  app: "1.0 (42)",
  catalog: "0.1.0",
  device: "iPhone",
  model: "vista-local-model-version",
  osVersion: "iOS 27.0",
  policy: "guidance-policy-version",
  profileVersion: 1,
};

const events = [
  {
    actor: "system",
    artifacts: [],
    category: "sessionLifecycle",
    eventID: "DE0E7B19-E75C-45A7-B7E8-8BB1263B4BB9",
    name: "session.runStarted",
    payload: {},
    privacy: "operational",
    retention: "untilAcknowledged",
    runID: runId,
    runKind: "inspection",
    schemaVersion: 2,
    seq: 0,
    severity: "info",
    tsMonotonic: 98,
    tsUTC: "2026-08-10T22:29:58Z",
    versions,
  },
  {
    actor: "system",
    artifacts: [
      {
        byteCount: jpegByteCount,
        id: artifactId,
        kind: "image/detailStill",
        mediaType: "image/jpeg",
        relativeLocation: `artifacts/${jpegSha256.slice(0, 2)}/${jpegSha256}`,
        sha256: jpegSha256,
      },
    ],
    category: "capture",
    eventID: "5984E224-2A30-414A-994A-315A7E28A529",
    name: "capture.saved",
    payload: {
      captureID: captureId,
      kind: "detailed",
    },
    privacy: "evidence",
    retention: "untilAcknowledged",
    runID: runId,
    runKind: "inspection",
    schemaVersion: 2,
    seq: 1,
    severity: "info",
    tsMonotonic: 99,
    tsUTC: "2026-08-10T22:29:59Z",
    versions,
  },
  {
    actor: "system",
    artifacts: [],
    category: "sessionLifecycle",
    eventID: "D80F60C6-A061-4A82-B275-8D9263BA8A79",
    name: "session.runCompleted",
    payload: {
      auditHealth: "normal",
      outcome: "completed",
    },
    privacy: "operational",
    retention: "untilAcknowledged",
    runID: runId,
    runKind: "inspection",
    schemaVersion: 2,
    seq: 2,
    severity: "info",
    tsMonotonic: 100,
    tsUTC: "2026-08-10T22:30:00Z",
    versions,
  },
];

let previousHash = "0".repeat(64);
const records = events.map((event) => {
  const chainHash = sha256(`${previousHash}${canonicalJSON(event)}`);
  const record = { chainHash, event, previousHash };
  previousHash = chainHash;
  return record;
});

const auditBytes = Buffer.from(canonicalJSON(records), "utf8");
writeFileSync(join(fixtureRoot, "audit-transport.json"), auditBytes);
const auditSha256 = sha256(auditBytes);
const terminalChainHash = records.at(-1).chainHash;
const sealedManifest = sha256(
  `manifest:${terminalChainHash}:${jpegSha256}`,
);

const manifest = {
  schemaVersion: 1,
  runId,
  runKind: "inspection",
  completedAt: "2026-08-10T22:30:00Z",
  versions: {
    app: versions.app,
    osVersion: versions.osVersion,
    device: versions.device,
    model: versions.model,
    catalog: versions.catalog,
    policy: versions.policy,
    profileVersion: versions.profileVersion,
    scenario: null,
  },
  context: {
    visitId: null,
    storeId: "store-id",
    assignmentId: null,
    targetAreaId: "target-area-id",
  },
  terminalChainHash,
  sealedManifest,
  artifacts: [
    {
      id: "audit-events",
      kind: "audit/events",
      mediaType: "application/json",
      sha256: auditSha256,
      byteCount: auditBytes.length,
      captureId: null,
    },
    {
      id: artifactId,
      kind: "image/detailStill",
      mediaType: "image/jpeg",
      sha256: jpegSha256,
      byteCount: jpegByteCount,
      captureId,
    },
  ],
};

const manifestBytes = Buffer.from(prettyJSON(manifest), "utf8");
writeFileSync(join(fixtureRoot, "manifest.json"), manifestBytes);
const manifestSha256 = sha256(manifestBytes);

const receipt = {
  schemaVersion: 1,
  status: "received",
  receiptId: "594bcc69-8f09-4dce-a98a-bba5de7ef0c2",
  runId,
  manifestSha256,
  artifactSha256: [auditSha256, jpegSha256].sort(),
  receivedAt: "2026-08-10T22:31:00Z",
  serverEnvironment: "development",
  ingestVersion: "vista-package-ingest-v1",
  analysisStatus: "notRequested",
};
writeUTF8("receipt.json", prettyJSON(receipt));

const ownerKey = sha256("vista-fixture-firebase-uid");
const normalizedRunId = runId.toLowerCase();
const objectPrefix = `vista/inspection-packages/${ownerKey}/${normalizedRunId}`;
const expectedPersistence = {
  fixtureFirebaseUid: "vista-fixture-firebase-uid",
  ownerKeyAlgorithm: "lowercase-hex-sha256-of-utf8-uid",
  ownerKey,
  packageRecord: {
    documentPath: `vistaInspectionPackageOwners/${ownerKey}/runs/${normalizedRunId}`,
    ownerKey,
    runId: normalizedRunId,
    manifestSha256,
    terminalChainHash,
    sealedManifest,
    status: "received",
    receiptId: receipt.receiptId,
    createdAt: "2026-08-10T22:30:59Z",
    receivedAt: receipt.receivedAt,
    artifactDescriptors: manifest.artifacts,
    analysisStatus: "notRequested",
  },
  storageObjects: [
    {
      path: `${objectPrefix}/manifest/${manifestSha256}.json`,
      sourceFile: "manifest.json",
      contentType: "application/json",
      sha256: manifestSha256,
      byteCount: manifestBytes.length,
      cacheControl: "private, no-store",
      public: false,
      createOnly: true,
    },
    {
      path: `${objectPrefix}/artifacts/${auditSha256}`,
      sourceFile: "audit-transport.json",
      contentType: "application/json",
      sha256: auditSha256,
      byteCount: auditBytes.length,
      cacheControl: "private, no-store",
      public: false,
      createOnly: true,
    },
    {
      path: `${objectPrefix}/artifacts/${jpegSha256}`,
      sourceFile: "accepted-detail.jpg",
      contentType: "image/jpeg",
      sha256: jpegSha256,
      byteCount: jpegByteCount,
      cacheControl: "private, no-store",
      public: false,
      createOnly: true,
    },
  ],
};
writeUTF8("expected-persistence.json", prettyJSON(expectedPersistence));

const requestMetadata = {
  method: "POST",
  path: "/v1/vista/inspection-packages",
  headers: {
    Authorization: "Bearer <fresh-firebase-id-token>",
    "Idempotency-Key": runId,
    "X-Vista-Manifest-SHA256": manifestSha256,
  },
  multipart: [
    {
      fieldName: "manifest",
      filename: "manifest.json",
      mediaType: "application/json",
      sha256: manifestSha256,
      byteCount: manifestBytes.length,
    },
    {
      fieldName: "artifact",
      filename: `${auditSha256}.json`,
      mediaType: "application/json",
      sha256: auditSha256,
      byteCount: auditBytes.length,
      sourceFile: "audit-transport.json",
    },
    {
      fieldName: "artifact",
      filename: `${jpegSha256}.jpg`,
      mediaType: "image/jpeg",
      sha256: jpegSha256,
      byteCount: jpegByteCount,
      sourceFile: "accepted-detail.jpg",
    },
  ],
  expectedFirstResponse: {
    httpStatus: 201,
    bodyFile: "receipt.json",
  },
  expectedIdenticalRetryResponse: {
    httpStatus: 200,
    bodyFile: "receipt.json",
  },
};
writeUTF8("request-metadata.json", prettyJSON(requestMetadata));

writeFileSync(
  join(invalidFixtureRoot, "manifest-extra-owner.json"),
  prettyJSON({ ...manifest, ownerId: "client-must-not-assert-owner" }),
  "utf8",
);
writeFileSync(
  join(invalidFixtureRoot, "manifest-wrong-run-kind.json"),
  prettyJSON({ ...manifest, runKind: "onboarding" }),
  "utf8",
);

console.log(`manifest ${manifestSha256} ${manifestBytes.length}`);
console.log(`audit ${auditSha256} ${auditBytes.length}`);
console.log(`jpeg ${jpegSha256} ${jpegByteCount}`);
console.log(`terminalChainHash ${terminalChainHash}`);
console.log(`sealedManifest ${sealedManifest}`);
