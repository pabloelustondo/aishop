const definitions = Object.freeze({
  unauthorized: [401, "Authentication is required.", false],
  unsupported_media_type: [415, "The package media type is unsupported.", false],
  multipart_invalid: [400, "The multipart package could not be read.", false],
  manifest_part_count_invalid: [400, "Exactly one manifest part is required.", false],
  idempotency_key_missing: [400, "The idempotency key is required.", false],
  idempotency_key_invalid: [400, "The idempotency key is invalid.", false],
  idempotency_key_mismatch: [400, "The idempotency key did not match the manifest.", false],
  manifest_hash_missing: [400, "The manifest hash is required.", false],
  manifest_hash_invalid: [400, "The manifest hash is invalid.", false],
  manifest_hash_mismatch: [400, "The manifest bytes did not match the hash.", false],
  manifest_invalid: [400, "The package manifest is invalid.", false],
  artifact_missing: [400, "A declared artifact is missing.", false],
  artifact_unexpected: [400, "An uploaded artifact was not declared.", false],
  artifact_duplicate: [400, "An artifact part was uploaded more than once.", false],
  artifact_identity_invalid: [400, "An artifact filename is invalid.", false],
  artifact_hash_mismatch: [400, "The uploaded artifact did not match the manifest.", false],
  artifact_byte_count_mismatch: [400, "The uploaded artifact length is incorrect.", false],
  audit_json_invalid: [400, "The audit artifact is not a JSON array.", false],
  invalid_jpeg: [400, "An image artifact is not a valid JPEG.", false],
  run_manifest_conflict: [409, "The run already has a different manifest.", false],
  package_too_large: [413, "The inspection package exceeds an approved limit.", false],
  evidence_persistence_unavailable: [503, "Package persistence is unavailable.", true],
  unexpected_server_error: [500, "The package could not be received.", true]
});

export class VistaPackageError extends Error {
  constructor(code, cause) {
    const [status, message, retryable] = definitions[code];
    super(message, cause ? { cause } : undefined);
    Object.assign(this, { name: "VistaPackageError", code, status, retryable });
  }
}

export const vistaError = (code, cause) => new VistaPackageError(code, cause);
export const vistaErrorBody = ({ code, message, retryable }) => Object.freeze({
  error: Object.freeze({ code, message, retryable })
});
