import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createEvidenceReader } from "./evidence-reader.js";
import { createEvidenceStore } from "./evidence-store.js";
import { createInspectionRecordReader } from "./inspection-record-reader.js";
import { createInspectionRecordStore } from "./inspection-record-store.js";
import { createVistaEvidenceStore } from "./vista-evidence-store.js";
import { createVistaPackageRecordStore } from "./vista-package-record-store.js";
import { createFirebaseVistaTokenVerifier } from "./firebase-vista-token-verifier.js";
import {
  createFirebaseVistaReservationDiagnostic
} from "./firebase-vista-reservation-diagnostic.js";

function firebaseResources() {
  const app = getApps()[0] ?? initializeApp();
  return { app, firestore: getFirestore(app), bucket: getStorage(app).bucket() };
}

export function createFirebaseServices() {
  const { app, firestore, bucket } = firebaseResources();
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

export function createFirebaseVistaServices({ serverEnvironment, ingestVersion,
  logger = console }) {
  const { app, firestore, bucket } = firebaseResources();
  return Object.freeze({
    evidenceStore: createVistaEvidenceStore({ bucket }),
    recordStore: createVistaPackageRecordStore({ firestore,
      clock: () => Timestamp.now().toDate(), serverEnvironment, ingestVersion,
      emitDiagnostic: createFirebaseVistaReservationDiagnostic(logger) }),
    verifyIdToken: createFirebaseVistaTokenVerifier(getAuth(app)),
    firestore,
    bucket
  });
}
