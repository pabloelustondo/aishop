import { vistaError } from "./vista-package-error.js";
import { createVistaPackageReceipt } from "./vista-package-receipt.js";
import { vistaPackageRecordRef } from "./vista-package-record-ref.js";
import { vistaServerTimestamp } from "./vista-package-time.js";

function sameReservation(record, input, ingestVersion) {
  return record.receiptRunId === input.receiptRunId &&
    record.terminalChainHash === input.terminalChainHash &&
    record.sealedManifest === input.sealedManifest &&
    record.ingestVersion === ingestVersion &&
    JSON.stringify(record.artifactDescriptors) === JSON.stringify(input.artifactDescriptors);
}

export async function finalizeVistaPackage({ firestore, input, clock,
  serverEnvironment, ingestVersion }) {
  const reference = vistaPackageRecordRef(firestore, input);
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw vistaError("evidence_persistence_unavailable");
    const record = snapshot.data();
    if (record.manifestSha256 !== input.manifestSha256) {
      throw vistaError("run_manifest_conflict");
    }
    if (record.status === "received") {
      return Object.freeze({ kind: "received", receipt: record.receipt });
    }
    if (record.status !== "receiving") {
      throw vistaError("evidence_persistence_unavailable");
    }
    if (!sameReservation(record, input, ingestVersion)) {
      throw vistaError("evidence_persistence_unavailable");
    }
    const receivedAt = vistaServerTimestamp(clock);
    const receiptInput = { ...input, receiptRunId: record.receiptRunId,
      artifactSha256: [...new Set(record.artifactDescriptors
        .map(({ sha256 }) => sha256))].sort() };
    const receipt = createVistaPackageReceipt(receiptInput, record.receiptId,
      receivedAt, serverEnvironment, ingestVersion);
    transaction.update(reference, { status: "received", receivedAt, receipt });
    return Object.freeze({ kind: "finalized", receipt });
  });
}
