export const APPROVED_VISTA_PACKAGE_LIMITS = Object.freeze({
  manifestBytes: { environment: "VISTA_MAX_MANIFEST_BYTES", value: 262_144 },
  auditBytes: { environment: "VISTA_MAX_AUDIT_BYTES", value: 5_242_880 },
  jpegBytes: { environment: "VISTA_MAX_JPEG_BYTES", value: 5_242_880 },
  packageBytes: { environment: "VISTA_MAX_PACKAGE_BYTES", value: 26_214_400 },
  jpegAxis: { environment: "VISTA_MAX_JPEG_AXIS", value: 4_096 },
  jpegPixels: { environment: "VISTA_MAX_JPEG_PIXELS", value: 16_777_216 },
  artifacts: { environment: "VISTA_MAX_ARTIFACTS", value: 40 },
  artifactParts: { environment: "VISTA_MAX_ARTIFACT_PARTS", value: 40 },
  multipartParts: { environment: "VISTA_MAX_MULTIPART_PARTS", value: 41 }
});

export function readVistaPackageLimits(environment) {
  const limits = {};
  for (const [name, specification] of Object.entries(APPROVED_VISTA_PACKAGE_LIMITS)) {
    const raw = environment[specification.environment];
    const value = Number(raw);
    if (raw === undefined || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${specification.environment} must be a positive integer.`);
    }
    if (value !== specification.value) {
      throw new Error(`${specification.environment} must equal the approved limit.`);
    }
    limits[name] = value;
  }
  return Object.freeze(limits);
}
