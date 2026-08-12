import { vistaError } from "./vista-package-error.js";
import { createHash } from "node:crypto";

const SHA256 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function vistaEvidenceObjects(input) {
  const computedManifestSha256 = createHash("sha256")
    .update(input.manifestBytes).digest("hex");
  if (!SHA256.test(input.ownerKey) || !UUID.test(input.runId) ||
      !SHA256.test(input.manifestSha256) ||
      computedManifestSha256 !== input.manifestSha256) {
    throw vistaError("evidence_persistence_unavailable");
  }
  const prefix = `vista/inspection-packages/${input.ownerKey}/${input.runId}`;
  const shared = { ownerKey: input.ownerKey, runId: input.runId,
    manifestSha256: input.manifestSha256 };
  const objects = [{ path: `${prefix}/manifest/${input.manifestSha256}.json`,
    bytes: input.manifestBytes, mediaType: "application/json",
    sha256: input.manifestSha256, shared }];
  for (const artifact of input.artifacts) {
    const computedSha256 = createHash("sha256").update(artifact.bytes).digest("hex");
    if (!SHA256.test(artifact.sha256) || computedSha256 !== artifact.sha256) {
      throw vistaError("evidence_persistence_unavailable");
    }
    objects.push({ path: `${prefix}/artifacts/${artifact.sha256}`,
      bytes: artifact.bytes, mediaType: artifact.mediaType,
      sha256: artifact.sha256, shared });
  }
  return Object.freeze(objects.map(Object.freeze));
}
