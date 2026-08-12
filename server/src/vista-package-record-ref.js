import { vistaError } from "./vista-package-error.js";

const SHA256 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function vistaPackageRecordRef(firestore, input) {
  if (!SHA256.test(input.ownerKey) || !UUID.test(input.runId) ||
      !SHA256.test(input.manifestSha256)) {
    throw vistaError("evidence_persistence_unavailable");
  }
  return firestore.collection("vistaInspectionPackageOwners")
    .doc(input.ownerKey).collection("runs").doc(input.runId);
}
