import { createDiagnostics, sanitizeDiagnostics } from "./agent-diagnostics.js";
import { createHash, randomUUID } from "node:crypto";
import {
  AgentAnalysisContextRequiredError,
  AgentAnalysisNotFoundError,
  AgentAnalysisRunLimitError,
  AgentAnalysisStateError
} from "./agent-analysis-store.js";
import { AgentAPIError, agentError, agentErrorBody } from "./agent-api-error.js";
import {
  AgentEvidenceAlreadyExistsError,
  AgentEvidenceUnavailableError
} from "./agent-evidence-store.js";
import { AgentUploadError, MAX_CONTEXT_CHARS, readAgentUpload } from "./agent-upload-request.js";
import { ProviderError } from "./errors.js";
import { sendBytes, sendJson } from "./http-json.js";

const BASE = "/v1/agent/analyses";

/** Server-generated, and shaped so no caller-supplied value can imitate one. */
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;

/**
 * A note is an instruction to a model, not a document. The ceiling is small
 * on purpose: a long note is a sign that the person wants a different image,
 * not a different sentence. One number serves the JSON run route and the
 * multipart field alike; the reader owns it.
 */
export { MAX_CONTEXT_CHARS };
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
export function serializeRecord(value) { return serialize(value); }

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
  // Deliberately 400, not the 409 the other state refusals use: the record is
  // not in the wrong state, the request is missing the thing that would make
  // a second run worth its cost.
  if (error instanceof AgentAnalysisContextRequiredError) {
    return agentError("context_required");
  }
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
  logger = console, diagnostics = createDiagnostics(event => logger.error(event)), project = process.env.GCLOUD_PROJECT,
  readMemory = () => process.memoryUsage()
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
    // Authorization is a custom claim Pablo sets on the account, the same
    // shape the review queue uses. It is read as the literal `true`: a claim
    // tool that wrote the string "true" would otherwise open the door.
    if (identity.agent !== true) throw agentError("forbidden");
    // The uid never becomes a path segment. A hash is a stable identity that
    // reveals nothing about the account it belongs to.
    return createHash("sha256").update(identity.uid).digest("hex");
  }

  async function upload(request, ownerKey, timed, diagnosticContext, signal) {
    const { file, run: requested, context } = await timed("validation", () => readAgentUpload(request));
    const analysisId = newAnalysisId();
    diagnosticContext.analysisId = analysisId;
    // Bytes first, record second: a record that points at nothing is worse
    // than an orphaned object nobody references.
    const stored = await timed("source_write", () => evidenceStore.storeSource({
      ownerKey, analysisId, bytes: file.bytes, mediaType: file.mediaType
    }));
    await timed("record_create", () => analysisStore.create({
      ownerKey, analysisId, fileName: file.fileName, mediaType: file.mediaType,
      sha256: stored.sha256, byteLength: stored.byteLength, width: file.width, height: file.height
    }));
    // The single call: the same run the page would press next, under the
    // same request. From here on the upload has succeeded, so a failure is
    // the run's failure and says which record to retry against.
    if (requested) {
      try {
        const record = await runner.run({ ownerKey, analysisId, context, diagnosticContext, signal });
        return [201, { analysis: serialize(record) }];
      } catch (error) {
        throw Object.assign(toAgentError(error), { analysisId });
      }
    }
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

  async function run(request, ownerKey, analysisId, diagnosticContext, signal) {
    const context = readContext(request);
    const record = await runner.run({ ownerKey, analysisId, context, diagnosticContext, signal });
    return [200, { analysis: serialize(record) }];
  }

  /**
   * The photograph a report was derived from.
   *
   * The bytes were stored on upload and, until now, read only by the runner.
   * A count is checkable only against the image it came from, so the page
   * needs them; nothing else about the contract changes. Served, never
   * redirected: the object is private to the function's service account and
   * the browser never touches Cloud Storage.
   */
  async function source(ownerKey, analysisId, response) {
    const record = await analysisStore.read({ ownerKey, analysisId });
    if (!record) throw agentError("analysis_not_found");
    const evidence = await evidenceStore.readSource({ ownerKey, analysisId });
    sendBytes(response, evidence);
    return null;
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
      if (method === "POST") return { operation: "upload", route: `POST ${BASE}` };
      if (method === "GET") return { operation: "list", route: `GET ${BASE}` };
      throw agentError("method_not_allowed");
    }
    if (!path.startsWith(`${BASE}/`)) throw agentError("not_found");

    const rest = path.slice(BASE.length + 1).split("/");
    const [analysisId, tail, ...extra] = rest;
    if (extra.length > 0
      || (tail !== undefined && tail !== "run" && tail !== "source")) {
      throw agentError("not_found");
    }
    // Checked before any lookup, so a crafted identifier is refused rather
    // than handed to a store to reject.
    if (!ANALYSIS_ID.test(analysisId)) throw agentError("analysis_not_found");

    if (tail === "run") {
      if (method !== "POST") throw agentError("method_not_allowed");
      return { operation: "run", analysisId, route: `POST ${BASE}/{analysisId}/run` };
    }
    if (tail === "source") {
      if (method !== "GET") throw agentError("method_not_allowed");
      return { operation: "source", analysisId, route: `GET ${BASE}/{analysisId}/source` };
    }
    if (method !== "GET") throw agentError("method_not_allowed");
    return { operation: "read", analysisId, route: `GET ${BASE}/{analysisId}` };
  }

  return async function handleAgentAPI(request, response, processContext = {}) {
    // The matched route template, never the caller's own path. A rejected URL
    // is attacker-controlled text, and a log line is somewhere it must not
    // reach; "unmatched" says all a reader needs about a request that fit no
    // route.
    let matched = "unmatched";
    const requestId = randomUUID();
    const started = performance.now();
    const diagnosticContext = { ...sanitizeDiagnostics(processContext), requestId, project };
    const cancellation = new AbortController();
    const onAbort = () => cancellation.abort();
    const onClose = () => { if (!response.writableEnded) onAbort(); };
    request.once?.("aborted", onAbort);
    response.once?.("close", onClose);
    const header = request.headers?.["x-cloud-trace-context"];
    const trace = typeof header === "string" && /^([a-f0-9]{32})\/(\d{1,20})(?:;o=[01])?$/.exec(header);
    if (trace && BigInt(trace[2]) <= 0xffffffffffffffffn) {
      diagnosticContext.trace = trace[1]; diagnosticContext.span = BigInt(trace[2]).toString(16).padStart(16, "0");
    }
    const emit = (event, fields = {}) => {
      let memorySnapshot = null;
      try {
        const memory = readMemory();
        memorySnapshot = { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed,
          heapTotalBytes: memory.heapTotal, externalBytes: memory.external, arrayBuffersBytes: memory.arrayBuffers };
      } catch {}
      try { diagnostics(event, { ...diagnosticContext, route: matched, ...fields, memorySnapshot }); } catch {}
    };
    let statusCode = 500;
    let errorCode;
    const writeHead = response.writeHead;
    response.writeHead = function(status, headers) {
      statusCode = status;
      return writeHead.call(this, status, { ...headers, "X-Request-ID": requestId });
    };
    async function timed(stage, work) {
      const start = performance.now(); emit("stage.started", { stage });
      try { const result = await work(); emit("stage.completed", { stage, durationMs: performance.now()-start }); return result; }
      catch (error) { emit("stage.failed", { stage, durationMs: performance.now()-start }); throw error; }
    }
    emit("request.started");
    try {
      const path = String(request.url ?? "").split("?")[0];
      const { operation, analysisId, route: template } = route(request.method, path);
      matched = template;
      const ownerKey = await ownerKeyFor(request);
      if (analysisId) diagnosticContext.analysisId = analysisId;
      // The one operation that answers with bytes writes its own response;
      // everything else hands back a status and a JSON body.
      if (operation === "source") {
        await source(ownerKey, analysisId, response);
        return;
      }
      const [status, body] = operation === "upload" ? await upload(request, ownerKey, timed, diagnosticContext, cancellation.signal)
        : operation === "run" ? await run(request, ownerKey, analysisId, diagnosticContext, cancellation.signal)
          : operation === "read" ? await read(ownerKey, analysisId)
            : await list(ownerKey);
      sendJson(response, status, body);
    } catch (error) {
      const safe = toAgentError(error);
      errorCode = safe.code;
      // `analysisId` is present only when an upload succeeded and its run did
      // not: the one case where the caller must not upload again.
      const named = ANALYSIS_ID.test(safe.analysisId) ? { analysisId: safe.analysisId } : {};
      sendJson(response, safe.status, { error: { ...agentErrorBody(safe).error, requestId, ...named } });
    } finally {
      emit("request.completed", { httpStatus: statusCode, errorCode, durationMs: performance.now() - started });
      response.writeHead = writeHead;
      request.removeListener?.("aborted", onAbort);
      response.removeListener?.("close", onClose);

    }
  };
}
