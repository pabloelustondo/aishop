import { createHash } from "node:crypto";
import { validateVistaManifest } from "./vista-manifest-validator.js";
import {
  validateVistaHeaders, validateVistaOuterMediaType
} from "./vista-package-headers.js";
import { vistaError } from "./vista-package-error.js";
import { readVistaMultipart } from "./vista-multipart-reader.js";
import {
  classifyVistaArtifacts, selectVistaParts
} from "./vista-package-part-set.js";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function readVistaPackageRequest(request, limits) {
  validateVistaOuterMediaType(request.headers);
  const rawParts = await readVistaMultipart(request, limits);
  const headers = validateVistaHeaders(request.headers);
  const { manifestPart, artifactParts } = selectVistaParts(rawParts, limits);
  if (sha256(manifestPart.bytes) !== headers.manifestSha256) {
    throw vistaError("manifest_hash_mismatch");
  }
  const manifest = validateVistaManifest(manifestPart.bytes, limits);
  if (manifest.normalizedRunId !== headers.normalizedRunId) {
    throw vistaError("idempotency_key_mismatch");
  }
  const artifacts = classifyVistaArtifacts(artifactParts);
  const declared = new Set(manifest.descriptorsByHash.keys());
  const uploaded = new Set(artifacts.map(({ claimedSha256 }) => claimedSha256));
  for (const hash of declared) if (!uploaded.has(hash)) throw vistaError("artifact_missing");
  for (const hash of uploaded) if (!declared.has(hash)) throw vistaError("artifact_unexpected");
  return Object.freeze({ runId: manifest.normalizedRunId, manifest,
    manifestBytes: manifestPart.bytes, manifestSha256: headers.manifestSha256,
    artifacts: Object.freeze(artifacts) });
}
