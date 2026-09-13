import { createHash, randomUUID } from "node:crypto";
import { createDiagnostics, sanitizeDiagnostics } from "./agent-diagnostics.js";
import { AdminAPIError, adminError, adminErrorBody } from "./admin-api-error.js";
import { serializeRecord } from "./agent-api-handler.js";
import { AgentEvidenceUnavailableError } from "./agent-evidence-store.js";
import { sendBytes, sendJson } from "./http-json.js";

const BASE = "/v1/admin/analyses";
const KEY = /^[a-f0-9]{64}$/;
const ID = /^[0-9A-Za-z_-]{1,64}$/;
const FILTERS = ["owner", "status", "from", "to", "cursor", "limit"];

/** Mirrors the agent handler's classification; duplicated for the same reason it duplicates VISTA's. */
const CREDENTIAL_CODES = new Set([
  "auth/argument-error", "auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token",
  "auth/mismatching-tenant-id", "auth/user-disabled", "auth/user-not-found"
]);
const INFRASTRUCTURE_PREFIXES = ["Error fetching public keys for Google certs:", "Error while making request:"];

function classifyVerifierFailure(error) {
  const infrastructure = error?.code === "auth/argument-error" && typeof error.message === "string"
    && INFRASTRUCTURE_PREFIXES.some((prefix) => error.message.startsWith(prefix));
  return adminError(CREDENTIAL_CODES.has(error?.code) && !infrastructure ? "unauthorized" : "unexpected_server_error", error);
}

function toAdminError(error) {
  if (error instanceof AdminAPIError) return error;
  if (error instanceof AgentEvidenceUnavailableError) return adminError("storage_unavailable", error);
  return adminError("unexpected_server_error", error);
}

/**
 * The three read operations of the All-runs page, behind the admin claim.
 *
 * Nothing here can write: the handler receives a reader, an identity
 * resolver and the evidence store's read side, and composes no runner. The
 * claim is checked before any of them is touched, on every request, so a
 * guessed owner key or a replayed cursor buys a non-admin nothing.
 */
export function createAdminAPIHandler({
  reader, identity, evidenceStore, verifyIdToken,
  logger = console, diagnostics = createDiagnostics(event => logger.error(event)), project = process.env.GCLOUD_PROJECT
} = {}) {
  if (typeof reader?.list !== "function" || typeof reader?.read !== "function") throw new TypeError("An admin analysis reader is required.");
  if (typeof identity?.labelsFor !== "function") throw new TypeError("An owner identity resolver is required.");
  if (typeof evidenceStore?.readSource !== "function") throw new TypeError("An agent evidence store is required.");
  if (typeof verifyIdToken !== "function") throw new TypeError("A token verifier is required.");

  async function actorKeyFor(request) {
    const authorization = request?.headers?.authorization;
    const token = typeof authorization === "string" ? /^Bearer ([^\s]+)$/.exec(authorization)?.[1] : null;
    if (!token) throw adminError("unauthorized");
    let claims;
    try { claims = await verifyIdToken(token); } catch (error) { throw classifyVerifierFailure(error); }
    if (typeof claims?.uid !== "string" || claims.uid.length === 0) throw adminError("unauthorized");
    if (claims.admin !== true) throw adminError("forbidden");
    return createHash("sha256").update(claims.uid).digest("hex");
  }

  function route(method, url) {
    const path = String(url ?? "").split("?")[0];
    if (path === BASE) {
      if (method !== "GET") throw adminError("method_not_allowed");
      return { operation: "admin.list", template: `GET ${BASE}` };
    }
    if (!path.startsWith(`${BASE}/`)) throw adminError("not_found");
    const [ownerKey, analysisId, tail, ...extra] = path.slice(BASE.length + 1).split("/");
    if (extra.length > 0 || (tail !== undefined && tail !== "source")) throw adminError("not_found");
    if (analysisId === undefined) throw adminError("not_found");
    if (!KEY.test(ownerKey) || !ID.test(analysisId)) throw adminError("analysis_not_found");
    if (method !== "GET") throw adminError("method_not_allowed");
    return tail === "source"
      ? { operation: "admin.source", ownerKey, analysisId, template: `GET ${BASE}/{ownerKey}/{analysisId}/source` }
      : { operation: "admin.read", ownerKey, analysisId, template: `GET ${BASE}/{ownerKey}/{analysisId}` };
  }

  function filtersOf(url) {
    const parameters = new URL(String(url ?? "/"), "http://admin.invalid").searchParams;
    const input = {};
    for (const name of FILTERS) {
      const value = parameters.get(name);
      if (value !== null && value !== "") input[name] = value;
    }
    return input;
  }

  async function list(url) {
    const page = await reader.list(filtersOf(url));
    const labels = await identity.labelsFor(page.analyses.map((row) => row.ownerKey));
    return [200, {
      analyses: page.analyses.map((row) => ({ ...serializeRecord(row), owner: labels[row.ownerKey] })),
      nextCursor: page.nextCursor
    }];
  }

  async function read(ownerKey, analysisId) {
    const record = await reader.read({ ownerKey, analysisId });
    if (!record) throw adminError("analysis_not_found");
    const labels = await identity.labelsFor([ownerKey]);
    return [200, { analysis: { ...serializeRecord(record), owner: labels[ownerKey] } }];
  }

  async function source(ownerKey, analysisId, response) {
    const record = await reader.read({ ownerKey, analysisId });
    if (!record) throw adminError("analysis_not_found");
    sendBytes(response, await evidenceStore.readSource({ ownerKey, analysisId }));
  }

  return async function handleAdminAPI(request, response, processContext = {}) {
    const requestId = randomUUID();
    const started = performance.now();
    const context = { ...sanitizeDiagnostics(processContext), requestId, project, route: "unmatched" };
    let statusCode = 500;
    let accessErrorCode;
    const writeHead = response.writeHead;
    response.writeHead = function(status, headers) {
      statusCode = status;
      return writeHead.call(this, status, { ...headers, "X-Request-ID": requestId });
    };
    try {
      const { operation, ownerKey, analysisId, template } = route(request.method, request.url);
      Object.assign(context, { route: template, operation, targetOwnerKey: ownerKey, analysisId });
      context.actorKey = await actorKeyFor(request);
      if (operation === "admin.source") { await source(ownerKey, analysisId, response); return; }
      const [status, body] = operation === "admin.list" ? await list(request.url) : await read(ownerKey, analysisId);
      sendJson(response, status, body);
    } catch (error) {
      const safe = toAdminError(error);
      accessErrorCode = safe.code;
      sendJson(response, safe.status, { error: { ...adminErrorBody(safe).error, requestId } });
    } finally {
      // One line per request, references only. The filters, the cursor and
      // the labels an administrator saw are deliberately not in it.
      try { diagnostics("access.completed", { ...context, httpStatus: statusCode, accessErrorCode, durationMs: performance.now() - started }); } catch {}
      response.writeHead = writeHead;
    }
  };
}
