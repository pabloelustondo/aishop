import { vistaError } from "./vista-package-error.js";
import { vistaPackageRecordRef } from "./vista-package-record-ref.js";
import { vistaServerTimestamp } from "./vista-package-time.js";

export async function reserveVistaPackage({ firestore, input, receiptId, clock,
  ingestVersion }) {
  const reference = vistaPackageRecordRef(firestore, input);
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists) {
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
      return Object.freeze({ kind: "resumed", receiptId: record.receiptId });
    }
    const id = receiptId();
    transaction.create(reference, { schemaVersion: 1, ownerKey: input.ownerKey,
      runId: input.runId, receiptRunId: input.receiptRunId,
      manifestSha256: input.manifestSha256,
      terminalChainHash: input.terminalChainHash,
      sealedManifest: input.sealedManifest,
      artifactDescriptors: structuredClone(input.artifactDescriptors),
      status: "receiving", receiptId: id, createdAt: vistaServerTimestamp(clock),
      receivedAt: null, ingestVersion, analysisStatus: "notRequested" });
    return Object.freeze({ kind: "reserved", receiptId: id });
  });
}
