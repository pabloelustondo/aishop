import Busboy from "busboy";
import { createHash } from "node:crypto";
import { isStructurallyValidJpeg } from "./jpeg-structure.js";
import { isStartOfFrame, readSegment, SOI } from "./jpeg-segment.js";

/** One still per upload; the ceilings match the existing image path. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;
export const MAX_AXIS = 4_096;
const ACCEPTED_MEDIA_TYPES = Object.freeze(["image/jpeg"]);

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
        limits: { files: 3, parts: 6, fields: 3, fieldSize: 1024,
          fileSize: MAX_FILE_BYTES + 1 }
      });
    } catch (error) { fail("multipart_invalid", error); return; }

    const files = [];
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
    parser.on("close", () => { if (!settled) { settled = true; resolve(files); } });
    parser.end(request.rawBody);
  });
}

/**
 * One uploaded still, verified before anything is stored or spent.
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

  const files = await parseParts(request);
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

  return Object.freeze({
    bytes: file.bytes,
    mediaType: file.mediaType,
    fileName: file.fileName,
    sha256: createHash("sha256").update(file.bytes).digest("hex"),
    width: dimensions.width,
    height: dimensions.height
  });
}
