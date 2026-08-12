import { decodeVistaJpeg } from "./vista-jpeg-decoder.js";
import { vistaError } from "./vista-package-error.js";

export function validateAudit(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!Array.isArray(JSON.parse(text))) throw new Error("not an array");
  } catch {
    throw vistaError("audit_json_invalid");
  }
}

export const validateJpeg = (bytes, limits) => decodeVistaJpeg(bytes, limits);
