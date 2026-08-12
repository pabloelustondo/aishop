import { createVistaEvidenceStore } from "../src/vista-evidence-store.js";
import { createVistaPackageAPIHandler } from "../src/vista-package-api-handler.js";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createVistaPackageSubmitter } from "../src/submit-vista-package.js";
import { createMemoryVistaBucket } from "./memory-vista-bucket.js";
import { createMemoryVistaFirestore } from "./memory-vista-firestore.js";
import { limits } from "./vista-limit-values.js";

export function createVistaAPIHarness(overrides = {}) {
  const bucket = overrides.bucket ?? createMemoryVistaBucket();
  const database = overrides.database ?? createMemoryVistaFirestore();
  let receipt = 0;
  const recordStore = createVistaPackageRecordStore({ firestore: database.firestore,
    receiptId: overrides.receiptId ?? (() =>
      `00000000-0000-4000-8000-${String(++receipt).padStart(12, "0")}`),
    clock: overrides.clock ?? (() => new Date("2026-08-10T22:31:00Z")),
    serverEnvironment: "development", ingestVersion: "vista-package-ingest-v1" });
  const submitVistaPackage = createVistaPackageSubmitter({ limits,
    evidenceStore: createVistaEvidenceStore({ bucket: bucket.bucket }), recordStore });
  const handler = createVistaPackageAPIHandler({ submitVistaPackage,
    verifyIdToken: overrides.verifyIdToken ?? (async () =>
      ({ uid: "vista-fixture-firebase-uid" })),
    logger: overrides.logger ?? { error() {} } });
  return { bucket, database, handler };
}
