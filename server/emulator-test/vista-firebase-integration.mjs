import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createVistaEvidenceStore } from "../src/vista-evidence-store.js";
import { createVistaPackageRecordStore } from "../src/vista-package-record-store.js";
import { createVistaPackageSubmitter } from "../src/submit-vista-package.js";
import { createVistaPackageAPIHandler } from "../src/vista-package-api-handler.js";
import { responseResult } from "../test-support/response-result.js";
import { limits } from "../test-support/vista-limit-values.js";
import { request } from "../test-support/vista-package-fixture.js";

const projectId = "demo-aishop-vista";
const bucketName = `${projectId}.appspot.com`;
const app = initializeApp({ projectId, storageBucket: bucketName }, "vista-emulator");
const firestore = getFirestore(app);
const bucket = getStorage(app).bucket();
const records = createVistaPackageRecordStore({ firestore,
  receiptId: () => "594bcc69-8f09-4dce-a98a-bba5de7ef0c2",
  clock: () => new Date("2026-08-10T22:31:00Z"),
  serverEnvironment: "emulator", ingestVersion: "vista-package-ingest-v1" });
const submit = createVistaPackageSubmitter({ limits,
  evidenceStore: createVistaEvidenceStore({ bucket }), recordStore: records });
const handler = createVistaPackageAPIHandler({ submitVistaPackage: submit,
  verifyIdToken: async () => ({ uid: "vista-fixture-firebase-uid" }),
  logger: { error() {} } });
const invoke = async () => { const output = responseResult();
  await handler(request(undefined, { authorization: "Bearer fixture" }), output.response);
  return output.result; };
const results = await Promise.all([invoke(), invoke()]);
assert.deepEqual(results.map(({ status }) => status).sort(), [200, 201]);
assert.deepEqual(results[0].body, results[1].body);
const owner = createHash("sha256").update("vista-fixture-firebase-uid").digest("hex");
const run = "2c11d24c-86da-4ae9-9be4-d67308e27389";
const record = await firestore.doc(
  `vistaInspectionPackageOwners/${owner}/runs/${run}`).get();
assert.equal(record.data().status, "received");
const [files] = await bucket.getFiles({ prefix:
  `vista/inspection-packages/${owner}/${run}/` });
assert.equal(files.length, 3);
for (const file of files) assert.equal((await file.getMetadata())[0].cacheControl,
  "private, no-store");
console.log(JSON.stringify({ statuses: results.map(({ status }) => status).sort(),
  receiptId: results[0].body.receiptId, objects: files.length }));
await deleteApp(app);
