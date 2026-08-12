import { randomUUID } from "node:crypto";
import { finalizeVistaPackage } from "./vista-package-finalization.js";
import { reserveVistaPackage } from "./vista-package-reservation.js";
import { VistaPackageError, vistaError } from "./vista-package-error.js";

async function persistenceOperation(work) {
  try { return await work(); }
  catch (error) {
    if (error instanceof VistaPackageError) throw error;
    throw vistaError("evidence_persistence_unavailable", error);
  }
}

const RECEIVING_RESUMED = Object.freeze({ schemaVersion: 1,
  event: "vista.package.receiving_resumed", state: "receiving" });

async function reserveWithDiagnostic(shared, input, emitDiagnostic) {
  const result = await persistenceOperation(() =>
    reserveVistaPackage({ ...shared, input }));
  if (result.kind === "resumed") await emitDiagnostic(RECEIVING_RESUMED);
  return result;
}

export function createVistaPackageRecordStore({ firestore, receiptId = randomUUID,
  clock = () => new Date(), serverEnvironment, ingestVersion,
  emitDiagnostic = () => {} }) {
  if (!firestore || typeof firestore.runTransaction !== "function") {
    throw new TypeError("Firestore is required.");
  }
  if (!serverEnvironment || !ingestVersion) {
    throw new TypeError("Receipt environment and ingest version are required.");
  }
  if (typeof emitDiagnostic !== "function") {
    throw new TypeError("A diagnostic emitter is required.");
  }
  const shared = { firestore, receiptId, clock, serverEnvironment, ingestVersion };
  return Object.freeze({
    reserve: (input) => reserveWithDiagnostic(shared, input, emitDiagnostic),
    finalize: (input) => persistenceOperation(() =>
      finalizeVistaPackage({ ...shared, input }))
  });
}
