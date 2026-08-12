import { normalizeVistaRunId } from "./vista-package-identity.js";
import { vistaError } from "./vista-package-error.js";

const SHA256 = /^[0-9a-f]{64}$/;

export function validateVistaHeaders(headers) {
  const idempotencyKey = headers["idempotency-key"];
  if (idempotencyKey === undefined) throw vistaError("idempotency_key_missing");
  const normalizedRunId = normalizeVistaRunId(idempotencyKey);
  if (!normalizedRunId) throw vistaError("idempotency_key_invalid");
  const manifestSha256 = headers["x-vista-manifest-sha256"];
  if (manifestSha256 === undefined) throw vistaError("manifest_hash_missing");
  if (typeof manifestSha256 !== "string" || !SHA256.test(manifestSha256)) {
    throw vistaError("manifest_hash_invalid");
  }
  return Object.freeze({ normalizedRunId, manifestSha256 });
}

export function validateVistaOuterMediaType(headers) {
  const type = headers["content-type"];
  if (typeof type !== "string" || !type.toLowerCase().startsWith("multipart/form-data;")) {
    throw vistaError("unsupported_media_type");
  }
}
