import { createHash, randomUUID } from "node:crypto";
import {
  AgentAnalysisNotFoundError,
  AgentAnalysisRunLimitError,
  AgentAnalysisStateError
} from "./agent-analysis-store.js";
import { AgentAPIError, agentError, agentErrorBody } from "./agent-api-error.js";
import {
  AgentEvidenceAlreadyExistsError,
  AgentEvidenceUnavailableError
} from "./agent-evidence-store.js";
import { AgentUploadError, readAgentUpload } from "./agent-upload-request.js";
import { ProviderError } from "./errors.js";
import { sendJson } from "./http-json.js";

const BASE = "/v1/agent/analyses";

/** Server-generated, and shaped so no caller-supplied value can imitate one. */
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;

/**
 * A note is an instruction to a model, not a document. The ceiling is small
 * on purpose: a long note is a sign that the person wants a different image,
 * not a different sentence.
 */
export const MAX_CONTEXT_CHARS = 500;
const MAX_CONTEXT_REQUEST_BYTES = 8 * 1024;

/**
 * Credential failures the caller can fix, told apart from infrastructure
 * failures they cannot.
 *
 * This repeats the classification in `vista-auth-failure.js` rather than
 * importing it: Sprint 008 imports no `vista-*` module, so that this endpoint
 * cannot be broken by a change made for a sealed device package. The cost is
 * one duplicated list; the alternative is a coupling nobody intended.
 */
const CREDENTIAL_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/mismatching-tenant-id",
  "auth/user-disabled",
  "auth/user-not-found"
]);
const INFRASTRUCTURE_PREFIXES = [
  "Error fetching public keys for Google certs:",
  "Error while making request:"
];

function classifyVerifierFailure(error) {
  const infrastructure = error?.code === "auth/argument-error"
    && typeof error.message === "string"
    && INFRASTRUCTURE_PREFIXES.some((prefix) => error.message.startsWith(prefix));
  return agentError(
    CREDENTIAL_CODES.has(error?.code) && !infrastructure
      ? "unauthorized" : "unexpected_server_error",
    error
  );
}

/**
 * Firestore timestamps and Dates leave this server as ISO strings.
 *
 * The stores hold whatever the database gives them, which is the right shape
 * for a database and the wrong shape for JSON: a Firestore Timestamp
 * serialises to its internal seconds and nanoseconds, which no page should
 * have to know about.
 */
function serialize(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, held]) => [key, serialize(held)])
    );
  }
  return value;
}

function toAgentError(error) {
  if (error instanceof AgentAPIError) return error;
  if (error instanceof AgentUploadError) return agentError(error.code, error);
  if (error instanceof AgentAnalysisNotFoundError) return agentError("analysis_not_found");
  if (error instanceof AgentAnalysisRunLimitError) return agentError("analysis_run_limit");
  if (error instanceof AgentAnalysisStateError) return agentError("analysis_state_invalid");
  if (error instanceof AgentEvidenceAlreadyExistsError) return agentError("source_exists", error);
  if (error instanceof AgentEvidenceUnavailableError) {
    return agentError("storage_unavailable", error);
  }
  if (error instanceof ProviderError) {
    return agentError(error.kind === "timeout" ? "provider_timeout" : "provider_failed", error);
  }
  return agentError("unexpected_server_error", error);
}

/** `{ context }`, or nothing at all. An automatic first run sends no body. */
function readContext(request) {
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

/**
 * The four operations of the agent upload path, behind one verified identity.
 *
 * Ownership is the hash of the verified uid and is derived here on every
 * request. A caller never supplies it and never learns another's, so reaching
 * someone else's analysis would require naming a key that is not derivable
 * from any token they hold.
 */
export function createAgentAPIHandler({
  evidenceStore, analysisStore, runner, verifyIdToken,
  newAnalysisId = () => randomUUID().replaceAll("-", ""),
  logger = console
} = {}) {
  if (typeof evidenceStore?.storeSource !== "function") {
    throw new TypeError("An agent evidence store is required.");
  }
  if (typeof analysisStore?.create !== "function") {
    throw new TypeError("An agent analysis store is required.");
  }
  if (typeof runner?.run !== "function") {
    throw new TypeError("An agent analysis runner is required.");
  }
  if (typeof verifyIdToken !== "function") {
    throw new TypeError("A token verifier is required.");
  }

  async function ownerKeyFor(request) {
    const authorization = request?.headers?.authorization;
    const token = typeof authorization === "string"
      ? /^Bearer ([^\s]+)$/.exec(authorization)?.[1] : null;
    if (!token) throw agentError("unauthorized");

    let identity;
    try {
      identity = await verifyIdToken(token);
    } catch (error) {
      throw classifyVerifierFailure(error);
    }
    if (typeof identity?.uid !== "string" || identity.uid.length === 0) {
      throw agentError("unauthorized");
    }
    // The uid never becomes a path segment. A hash is a stable identity that
    // reveals nothing about the account it belongs to.
    return createHash("sha256").update(identity.uid).digest("hex");
  }

  async function upload(request, ownerKey) {
    const file = await readAgentUpload(request);
    const analysisId = newAnalysisId();
    // Bytes first, record second: a record that points at nothing is worse
    // than an orphaned object nobody references.
    const stored = await evidenceStore.storeSource({
      ownerKey, analysisId, bytes: file.bytes, mediaType: file.mediaType
    });
    await analysisStore.create({
      ownerKey, analysisId, fileName: file.fileName, mediaType: file.mediaType,
      sha256: stored.sha256, byteLength: stored.byteLength
    });
    // Narrow and true: the bytes are durable and nobody has looked at them.
    // The record's own timestamps are server-authored and are read back, not
    // guessed at here.
    return [201, { analysis: {
      analysisId, status: "uploaded", fileName: file.fileName,
      mediaType: file.mediaType, sha256: stored.sha256,
      byteLength: stored.byteLength, width: file.width, height: file.height,
      runCount: 0, runs: []
    } }];
  }

  async function run(request, ownerKey, analysisId) {
    const context = readContext(request);
    const record = await runner.run({ ownerKey, analysisId, context });
    return [200, { analysis: serialize(record) }];
  }

  async function read(ownerKey, analysisId) {
    const record = await analysisStore.read({ ownerKey, analysisId });
    // A record belonging to someone else is not found, because under this
    // caller's owner key it genuinely does not exist. There is nothing to
    // forbid and nothing to disclose.
    if (!record) throw agentError("analysis_not_found");
    return [200, { analysis: serialize(record) }];
  }

  async function list(ownerKey) {
    const records = await analysisStore.list({ ownerKey });
    return [200, { analyses: records.map(serialize) }];
  }

  function route(method, path) {
    if (path === BASE) {
      if (method === "POST") return { operation: "upload" };
      if (method === "GET") return { operation: "list" };
      throw agentError("method_not_allowed");
    }
    if (!path.startsWith(`${BASE}/`)) throw agentError("not_found");

    const rest = path.slice(BASE.length + 1).split("/");
    const [analysisId, tail, ...extra] = rest;
    if (extra.length > 0 || (tail !== undefined && tail !== "run")) {
      throw agentError("not_found");
    }
    // Checked before any lookup, so a crafted identifier is refused rather
    // than handed to a store to reject.
    if (!ANALYSIS_ID.test(analysisId)) throw agentError("analysis_not_found");

    if (tail === "run") {
      if (method !== "POST") throw agentError("method_not_allowed");
      return { operation: "run", analysisId };
    }
    if (method !== "GET") throw agentError("method_not_allowed");
    return { operation: "read", analysisId };
  }

  return async function handleAgentAPI(request, response) {
    let path = "";
    try {
      path = String(request.url ?? "").split("?")[0];
      const { operation, analysisId } = route(request.method, path);
      const ownerKey = await ownerKeyFor(request);
      const [status, body] = operation === "upload" ? await upload(request, ownerKey)
        : operation === "run" ? await run(request, ownerKey, analysisId)
          : operation === "read" ? await read(ownerKey, analysisId)
            : await list(ownerKey);
      sendJson(response, status, body);
    } catch (error) {
      const safe = toAgentError(error);
      // Code, status and path only. A cause can carry a bucket name, a URL,
      // or a fragment of a credential, and none of that belongs in a log.
      logger.error("Agent analysis request refused.",
        { code: safe.code, status: safe.status, path });
      sendJson(response, safe.status, agentErrorBody(safe));
    }
  };
}
