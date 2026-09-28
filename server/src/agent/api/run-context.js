import { agentError } from "../../agent-api-error.js";
import { MAX_CONTEXT_CHARS } from "../../agent-upload-request.js";

const MAX_CONTEXT_REQUEST_BYTES = 8 * 1024;

/** `{ context }`, or nothing at all. An automatic first run sends no body. */
export function readContext(request) {
  const raw = request.rawBody;
  if (!raw || raw.length === 0) return null;
  if (raw.length > MAX_CONTEXT_REQUEST_BYTES) throw agentError("context_invalid");

  let payload;
  try {
    payload = JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw));
  } catch (error) {
    throw agentError("context_invalid", error);
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw agentError("context_invalid");
  }

  const { context } = payload;
  if (context === undefined || context === null) return null;
  if (typeof context !== "string") throw agentError("context_invalid");
  const note = context.trim();
  if (note === "") return null;
  if (note.length > MAX_CONTEXT_CHARS) throw agentError("context_invalid");
  return note;
}
