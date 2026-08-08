export class EvidenceNotFoundError extends Error {
  constructor() {
    super("Original evidence was not found.");
    this.name = "EvidenceNotFoundError";
  }
}

export function createEvidenceReader({ bucket }) {
  if (!bucket || typeof bucket.file !== "function") {
    throw new TypeError("A Cloud Storage bucket is required.");
  }
  return Object.freeze({
    async readOriginal(scanId) {
      const objectPath = `inspections/${scanId}/original.jpg`;
      try {
        const [bytes] = await bucket.file(objectPath).download();
        return Object.freeze({ bytes, mediaType: "image/jpeg", objectPath });
      } catch (error) {
        if (error?.code === 404) throw new EvidenceNotFoundError();
        throw error;
      }
    }
  });
}
