import { ClientError, ERROR_MESSAGES } from "./errors.js";

export function sendJson(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...headers
  });
  response.end(body);
}

export async function readJson(request, maxBytes) {
  const prepared = request.rawBody ?? request.body;
  if (prepared !== undefined) {
    const bytes = Buffer.isBuffer(prepared)
      ? prepared
      : Buffer.from(typeof prepared === "string" ? prepared : JSON.stringify(prepared));
    if (bytes.length > maxBytes) throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
    try {
      return JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
    }
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBytes) throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
  }
}

export function sendBytes(response, evidence) {
  response.writeHead(200, {
    "Cache-Control": "private, no-store",
    "Content-Type": evidence.mediaType,
    "Content-Length": evidence.bytes.length
  });
  response.end(evidence.bytes);
}
