import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { createAgentAnalysisStore } from "./agent-analysis-store.js";
import { createAgentEvidenceStore } from "./agent-evidence-store.js";
import { createAdminAnalysisReader } from "./admin-analysis-reader.js";
import { createOwnerIdentityResolver } from "./admin-owner-identity.js";
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

/**
 * The agent upload path's own resources.
 *
 * Separate from the VISTA services deliberately: its own Firestore collection
 * and its own Storage prefix, sharing only the Firebase app and the token
 * verifier. Nothing here reads or writes a VISTA record or object.
 *
 * The store takes both a server timestamp and a clock because they are not
 * interchangeable — Firestore refuses a server-timestamp sentinel written
 * inside an array element, and the run history is an array.
 */
export function createFirebaseAgentServices() {
  const { app, firestore, bucket } = firebaseResources();
  return Object.freeze({
    evidenceStore: createAgentEvidenceStore({ bucket }),
    analysisStore: createAgentAnalysisStore({
      firestore,
      serverTimestamp: FieldValue.serverTimestamp,
      clock: () => Timestamp.now().toDate()
    }),
    verifyIdToken: createFirebaseVistaTokenVerifier(getAuth(app))
  });
}

/**
 * The All-runs read side (Sprint 012). It shares the agent's evidence
 * bucket and token verifier, reads the same Firestore records across owners,
 * and adds the Auth directory walk that turns an owner key into a label. No
 * write capability is composed here: there is no analysis store and no runner.
 */
export function createFirebaseAdminServices() {
  const { app, firestore, bucket } = firebaseResources();
  return Object.freeze({
    reader: createAdminAnalysisReader({ firestore }),
    identity: createOwnerIdentityResolver({ auth: getAuth(app) }),
    evidenceStore: createAgentEvidenceStore({ bucket }),
    verifyIdToken: createFirebaseVistaTokenVerifier(getAuth(app))
  });
}
