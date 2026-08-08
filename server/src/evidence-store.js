import { createHash } from "node:crypto";

export class EvidenceAlreadyExistsError extends Error {
  constructor() {
    super("Evidence already exists for this scan.");
    this.name = "EvidenceAlreadyExistsError";
  }
}

export function createEvidenceStore({ bucket }) {
  if (!bucket || typeof bucket.file !== "function") {
    throw new TypeError("A Cloud Storage bucket is required.");
  }
  return Object.freeze({
    async preserveOriginal({ scanId, imageBase64 }) {
      const bytes = Buffer.from(imageBase64, "base64");
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const objectPath = `inspections/${scanId}/original.jpg`;
      try {
        await bucket.file(objectPath).save(bytes, {
          resumable: false,
          preconditionOpts: { ifGenerationMatch: 0 },
          metadata: {
            contentType: "image/jpeg",
            cacheControl: "private, no-store",
            metadata: { sha256 }
          }
        });
      } catch (error) {
        if (error?.code === 412) throw new EvidenceAlreadyExistsError();
        throw error;
      }
      return Object.freeze({
        objectPath,
        sha256,
        byteLength: bytes.length,
        mediaType: "image/jpeg"
      });
    }
  });
}
