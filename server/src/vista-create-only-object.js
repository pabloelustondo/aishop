import { createHash } from "node:crypto";
import { VistaPackageError, vistaError } from "./vista-package-error.js";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function options(specification) {
  return { resumable: false, preconditionOpts: { ifGenerationMatch: 0 },
    metadata: { contentType: specification.mediaType,
      cacheControl: "private, no-store", metadata: {
        ...specification.shared, sha256: specification.sha256,
        byteLength: String(specification.bytes.length)
      } } };
}

async function verifyExisting(file, specification) {
  const [[bytes], [metadata]] = await Promise.all([
    file.download(), file.getMetadata()
  ]);
  const custom = metadata.metadata ?? {};
  const valid = bytes.length === specification.bytes.length &&
    sha256(bytes) === specification.sha256 &&
    metadata.contentType === specification.mediaType &&
    metadata.cacheControl === "private, no-store" &&
    custom.sha256 === specification.sha256 &&
    custom.byteLength === String(specification.bytes.length) &&
    custom.ownerKey === specification.shared.ownerKey &&
    custom.runId === specification.shared.runId &&
    custom.manifestSha256 === specification.shared.manifestSha256;
  if (!valid) throw vistaError("evidence_persistence_unavailable");
}

export async function createOrVerifyObject(bucket, specification) {
  const file = bucket.file(specification.path);
  try {
    await file.save(specification.bytes, options(specification));
  } catch (error) {
    if (error?.code !== 412) throw vistaError("evidence_persistence_unavailable", error);
    try { await verifyExisting(file, specification); }
    catch (verificationError) {
      if (verificationError instanceof VistaPackageError) throw verificationError;
      throw vistaError("evidence_persistence_unavailable", verificationError);
    }
  }
}
