import { vistaError } from "./vista-package-error.js";

const ARTIFACT = /^([0-9a-f]{64})\.(json|jpg)$/;

export function selectVistaParts(parts, limits) {
  const manifests = parts.filter(({ name }) => name === "manifest");
  if (manifests.length !== 1) throw vistaError("manifest_part_count_invalid");
  const manifestPart = manifests[0];
  if (manifestPart.filename !== "manifest.json" || manifestPart.type !== "application/json") {
    throw vistaError("multipart_invalid");
  }
  if (manifestPart.bytes.length > limits.manifestBytes) throw vistaError("package_too_large");
  const artifactParts = parts.filter((part) => part !== manifestPart);
  if (artifactParts.some(({ name }) => name !== "artifact")) {
    throw vistaError("multipart_invalid");
  }
  if (artifactParts.length > limits.artifactParts) throw vistaError("package_too_large");
  return Object.freeze({ manifestPart, artifactParts });
}

export function classifyVistaArtifacts(artifactParts) {
  const identities = artifactParts.map((part) => {
    const identity = ARTIFACT.exec(part.filename ?? "");
    if (!identity) throw vistaError("artifact_identity_invalid");
    return { part, claimedSha256: identity[1] };
  });
  const artifacts = [];
  const hashes = new Set();
  for (const { part, claimedSha256 } of identities) {
    if (hashes.has(claimedSha256)) throw vistaError("artifact_duplicate");
    hashes.add(claimedSha256);
    artifacts.push(Object.freeze({ ...part, claimedSha256 }));
  }
  return Object.freeze(artifacts);
}
