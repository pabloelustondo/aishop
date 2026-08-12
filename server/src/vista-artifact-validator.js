import { createHash } from "node:crypto";
import { validateAudit, validateJpeg } from "./vista-artifact-content.js";
import { vistaError } from "./vista-package-error.js";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function validateOne(part, descriptor, limits) {
  const audit = descriptor.kind === "audit/events";
  const byteLimit = audit ? limits.auditBytes : limits.jpegBytes;
  const extension = audit ? ".json" : ".jpg";
  if (part.bytes.length > byteLimit) throw vistaError("package_too_large");
  if (part.bytes.length !== descriptor.byteCount) {
    throw vistaError("artifact_byte_count_mismatch");
  }
  const computed = sha256(part.bytes);
  if (computed !== descriptor.sha256 || computed !== part.claimedSha256) {
    throw vistaError("artifact_hash_mismatch");
  }
  if (part.type !== descriptor.mediaType || !part.filename.endsWith(extension)) {
    throw vistaError("unsupported_media_type");
  }
  const dimensions = audit ? null : await validateJpeg(part.bytes, limits);
  if (audit) validateAudit(part.bytes);
  return Object.freeze({ sha256: computed, bytes: part.bytes,
    byteLength: part.bytes.length, mediaType: descriptor.mediaType,
    descriptor, dimensions });
}

export async function validateVistaArtifacts(packageValue, limits) {
  const validated = [];
  const parts = [...packageValue.artifacts]
    .sort((left, right) => left.claimedSha256.localeCompare(right.claimedSha256));
  for (const part of parts) validated.push(await validateOne(part,
    packageValue.manifest.descriptorsByHash.get(part.claimedSha256), limits));
  return Object.freeze(validated);
}
