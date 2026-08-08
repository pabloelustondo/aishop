import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createEvidenceReader } from "./evidence-reader.js";
import { createEvidenceStore } from "./evidence-store.js";
import { createInspectionRecordReader } from "./inspection-record-reader.js";
import { createInspectionRecordStore } from "./inspection-record-store.js";

export function createFirebaseServices() {
  const app = getApps()[0] ?? initializeApp();
  const firestore = getFirestore(app);
  const bucket = getStorage(app).bucket();
  return Object.freeze({
    evidenceStore: createEvidenceStore({ bucket }),
    evidenceReader: createEvidenceReader({ bucket }),
    recordStore: createInspectionRecordStore({
      firestore,
      serverTimestamp: FieldValue.serverTimestamp
    }),
    recordReader: createInspectionRecordReader({ firestore }),
    verifyIdToken: (token) => getAuth(app).verifyIdToken(token)
  });
}
