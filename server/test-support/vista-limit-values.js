export const limits = Object.freeze({
  manifestBytes: 262_144,
  auditBytes: 5_242_880,
  jpegBytes: 5_242_880,
  packageBytes: 26_214_400,
  jpegAxis: 4_096,
  jpegPixels: 16_777_216,
  artifacts: 40,
  artifactParts: 40,
  multipartParts: 41
});

export const limitEnvironment = Object.freeze({
  VISTA_MAX_MANIFEST_BYTES: "262144",
  VISTA_MAX_AUDIT_BYTES: "5242880",
  VISTA_MAX_JPEG_BYTES: "5242880",
  VISTA_MAX_PACKAGE_BYTES: "26214400",
  VISTA_MAX_JPEG_AXIS: "4096",
  VISTA_MAX_JPEG_PIXELS: "16777216",
  VISTA_MAX_ARTIFACTS: "40",
  VISTA_MAX_ARTIFACT_PARTS: "40",
  VISTA_MAX_MULTIPART_PARTS: "41"
});
