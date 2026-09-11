import Busboy from "busboy";
import { createHash } from "node:crypto";
import { isStructurallyValidJpeg } from "./jpeg-structure.js";
import { isStartOfFrame, readSegment, SOI } from "./jpeg-segment.js";

/** One still per upload; the ceilings match the existing image path. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;
export const MAX_AXIS = 4_096;
const ACCEPTED_MEDIA_TYPES = Object.freeze(["image/jpeg"]);
/**
 * The note ceiling is in characters, to match the JSON run route; Busboy's
 * field ceiling is in bytes, so it is set to hold any 500-character string.
 */
export const MAX_CONTEXT_CHARS = 500;
const MAX_FIELD_BYTES = MAX_CONTEXT_CHARS * 4;

/** Stable codes; the handler maps them to statuses and messages. */
export class AgentUploadError extends Error {
  constructor(code, cause) {
    super(`Agent upload rejected: ${code}.`, { cause });
    this.name = "AgentUploadError";
    this.code = code;
  }
}

/**
 * Dimensions of an already structurally valid JPEG, read from its first
 * start-of-frame header. This reads a header; it does not decode. The bytes
 * are validated first, so the walk cannot run off the end of a malformed file.
 */
function jpegDimensions(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === SOI || marker === 0x01
      || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const segment = readSegment(bytes, offset);
    if (!segment) return null;
    if (isStartOfFrame(marker)) {
      return { height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5) };
    }
    offset = segment.end;
  }
  return null;
}

function parseParts(request) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (code, cause) => {
      if (!settled) { settled = true; reject(new AgentUploadError(code, cause)); }
    };
    let parser;
    try {
      parser = Busboy({
        headers: request.headers,
        limits: { files: 3, parts: 8, fields: 4, fieldSize: MAX_FIELD_BYTES,
          fileSize: MAX_FILE_BYTES + 1 }
      });
    } catch (error) { fail("multipart_invalid", error); return; }

    const files = [];
    const fields = {};
    // A truncated field is one that was too long; it is reported as invalid
    // rather than quietly shortened into a different instruction.
    parser.on("field", (name, value, info) => {
      if (info?.valueTruncated) fail("context_invalid");
      else if (name === "run" || name === "context") fields[name] = value;
    });
    parser.on("file", (name, stream, info) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("limit", () => fail("file_too_large"));
      stream.on("end", () => files.push({
        name, fileName: info.filename ?? null,
        mediaType: (info.mimeType ?? "").toLowerCase(),
        bytes: Buffer.concat(chunks)
      }));
      stream.on("error", (error) => fail("multipart_invalid", error));
    });
    parser.on("filesLimit", () => fail("file_count_invalid"));
    parser.on("error", (error) => fail("multipart_invalid", error));
    parser.on("close", () => { if (!settled) { settled = true; resolve({ files, fields }); } });
    parser.end(request.rawBody);
  });
}

/**
 * One uploaded still, verified before anything is stored or spent, plus the
 * two optional fields that ask for an analysis in the same call.
 *
 * The declared media type is checked and then disbelieved: a browser will say
 * whatever the file extension implies, so the bytes themselves decide whether
 * this is a JPEG. Everything here happens before storage and before the
 * provider, so an unusable file costs nothing.
 */
export async function readAgentUpload(request) {
  const contentType = String(request?.headers?.["content-type"] ?? "");
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new AgentUploadError("multipart_invalid");
  }
  if (!Buffer.isBuffer(request.rawBody)) throw new AgentUploadError("multipart_invalid");
  if (request.rawBody.length > MAX_REQUEST_BYTES) {
    throw new AgentUploadError("file_too_large");
  }

  const { files, fields } = await parseParts(request);
  if (files.length === 0) throw new AgentUploadError("file_missing");
  if (files.length > 1) throw new AgentUploadError("file_count_invalid");

  const [file] = files;
  if (!ACCEPTED_MEDIA_TYPES.includes(file.mediaType)) {
    throw new AgentUploadError("media_type_unsupported");
  }
  if (file.bytes.length === 0) throw new AgentUploadError("file_missing");
  if (file.bytes.length > MAX_FILE_BYTES) throw new AgentUploadError("file_too_large");
  if (!isStructurallyValidJpeg(file.bytes)) throw new AgentUploadError("file_not_jpeg");

  const dimensions = jpegDimensions(file.bytes);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1
    || dimensions.width > MAX_AXIS || dimensions.height > MAX_AXIS) {
    throw new AgentUploadError("file_dimensions_invalid");
  }

  // `run` is a switch, not a string: only the literal `true` turns it on, so
  // a form that sends "on" or "1" by accident stores the image and spends
  // nothing. `context` follows the run route's own rules exactly.
  const run = fields.run === "true";
  let context = null;
  if (typeof fields.context === "string") {
    const note = fields.context.trim();
    if (note.length > MAX_CONTEXT_CHARS) throw new AgentUploadError("context_invalid");
    context = note === "" ? null : note;
  }

  return Object.freeze({
    file: Object.freeze({
      bytes: file.bytes,
      mediaType: file.mediaType,
      fileName: file.fileName,
      sha256: createHash("sha256").update(file.bytes).digest("hex"),
      width: dimensions.width,
      height: dimensions.height
    }),
    run,
    context
  });
}
