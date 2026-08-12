import { validateVistaArtifacts } from "./vista-artifact-validator.js";
import { readVistaPackageRequest } from "./vista-package-request.js";

function recordInput(ownerKey, packageValue, artifacts) {
  const { manifest } = packageValue;
  return Object.freeze({ ownerKey, runId: packageValue.runId,
    receiptRunId: manifest.runId, manifestSha256: packageValue.manifestSha256,
    terminalChainHash: manifest.terminalChainHash,
    sealedManifest: manifest.sealedManifest,
    artifactDescriptors: manifest.artifacts,
    artifactSha256: artifacts.map(({ sha256 }) => sha256) });
}

export function createVistaPackageSubmitter({ limits, evidenceStore, recordStore }) {
  return async function submitVistaPackage(request, ownerKey) {
    const packageValue = await readVistaPackageRequest(request, limits);
    const artifacts = await validateVistaArtifacts(packageValue, limits);
    const input = recordInput(ownerKey, packageValue, artifacts);
    const reservation = await recordStore.reserve(input);
    if (reservation.kind === "received") {
      return Object.freeze({ status: 200, receipt: reservation.receipt });
    }
    await evidenceStore.preservePackage({ ...packageValue, ownerKey, artifacts });
    const finalization = await recordStore.finalize(input);
    return Object.freeze({ status: finalization.kind === "finalized" ? 201 : 200,
      receipt: finalization.receipt });
  };
}
