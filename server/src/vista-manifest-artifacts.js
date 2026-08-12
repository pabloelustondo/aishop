import { vistaError } from "./vista-package-error.js";

export function validateArtifactDescriptors(artifacts, maximum) {
  if (artifacts.length > maximum) throw vistaError("package_too_large");
  const ids = new Set();
  const hashes = new Map();
  let auditCount = 0;
  let imageCount = 0;
  for (const artifact of artifacts) {
    if (ids.has(artifact.id)) throw vistaError("manifest_invalid");
    ids.add(artifact.id);
    if (artifact.kind === "audit/events") auditCount += 1;
    else imageCount += 1;
    const existing = hashes.get(artifact.sha256);
    if (existing && (existing.mediaType !== artifact.mediaType ||
        existing.byteCount !== artifact.byteCount)) {
      throw vistaError("manifest_invalid");
    }
    hashes.set(artifact.sha256, artifact);
  }
  if (auditCount !== 1 || imageCount < 1) throw vistaError("manifest_invalid");
  return hashes;
}
