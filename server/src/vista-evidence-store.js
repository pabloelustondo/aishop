import { createOrVerifyObject } from "./vista-create-only-object.js";
import { vistaEvidenceObjects } from "./vista-evidence-objects.js";

export function createVistaEvidenceStore({ bucket }) {
  if (!bucket || typeof bucket.file !== "function") {
    throw new TypeError("A Cloud Storage bucket is required.");
  }
  return Object.freeze({
    async preservePackage(input) {
      for (const specification of vistaEvidenceObjects(input)) {
        await createOrVerifyObject(bucket, specification);
      }
    }
  });
}
