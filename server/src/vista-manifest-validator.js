import { normalizeVistaRunId } from "./vista-package-identity.js";
import { validateArtifactDescriptors } from "./vista-manifest-artifacts.js";
import { vistaError } from "./vista-package-error.js";
import { validateVistaManifestSchema } from "./vista-manifest-schema.js";

function parseManifest(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text);
  } catch {
    throw vistaError("manifest_invalid");
  }
}

export function validateVistaManifest(bytes, limits) {
  const manifest = parseManifest(bytes);
  if (Array.isArray(manifest?.artifacts) && manifest.artifacts.length > limits.artifacts) {
    throw vistaError("package_too_large");
  }
  if (!validateVistaManifestSchema(manifest)) throw vistaError("manifest_invalid");
  const normalizedRunId = normalizeVistaRunId(manifest.runId);
  if (!normalizedRunId || !Number.isFinite(Date.parse(manifest.completedAt))) {
    throw vistaError("manifest_invalid");
  }
  const descriptorsByHash = validateArtifactDescriptors(
    manifest.artifacts, limits.artifacts
  );
  return Object.freeze({ ...manifest, normalizedRunId, descriptorsByHash });
}
