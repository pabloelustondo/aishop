import Busboy from "busboy";
import { retainVistaPartBytes } from "./vista-multipart-bytes.js";
import { vistaError } from "./vista-package-error.js";

function rawRequestBytes(request, maximum) {
  const bytes = request.rawBody;
  if (!Buffer.isBuffer(bytes)) throw vistaError("multipart_invalid");
  if (bytes.length > maximum) throw vistaError("package_too_large");
  return bytes;
}

export function readVistaMultipart(request, limits) {
  const bytes = rawRequestBytes(request, limits.packageBytes);
  return new Promise((resolve, reject) => {
    const parts = [];
    let settled = false;
    const fail = (error) => { if (!settled) { settled = true; reject(error); } };
    let parser;
    try {
      parser = Busboy({ headers: request.headers, preservePath: true,
        limits: { files: limits.multipartParts, parts: limits.multipartParts + 1,
          fields: limits.multipartParts, fieldSize: 0,
          fileSize: Math.max(limits.manifestBytes, limits.auditBytes,
            limits.jpegBytes) + 1 } });
    } catch (error) { fail(vistaError("multipart_invalid", error)); return; }
    parser.on("file", (name, stream, info) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("limit", () => fail(vistaError("package_too_large")));
      stream.on("end", () => parts.push({ name, filename: info.filename,
        type: info.mimeType, bytes: retainVistaPartBytes(chunks, bytes) }));
    });
    parser.on("field", (name, _value, info) => parts.push({ name,
      filename: null, type: info.mimeType, bytes: Buffer.alloc(0), field: true }));
    parser.on("partsLimit", () => fail(vistaError("package_too_large")));
    parser.on("filesLimit", () => fail(vistaError("package_too_large")));
    parser.on("fieldsLimit", () => fail(vistaError("package_too_large")));
    parser.on("error", (error) => fail(vistaError("multipart_invalid", error)));
    parser.on("finish", () => { if (!settled) { settled = true; resolve(parts); } });
    parser.end(bytes);
  });
}
