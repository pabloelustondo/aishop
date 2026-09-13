/** A closed diagnostic schema shared by logging and durable run summaries. */
const choices = {
  errorCode: [
    "unauthorized", "forbidden", "not_found", "method_not_allowed", "multipart_invalid",
    "file_missing", "file_count_invalid", "file_not_jpeg", "file_dimensions_invalid",
    "file_too_large", "media_type_unsupported", "context_invalid", "context_required",
    "analysis_not_found", "analysis_state_invalid", "analysis_run_limit", "source_exists",
    "storage_unavailable", "provider_timeout", "provider_failed", "unexpected_server_error"
  ],
  failureClass: [
    "provider_output_limit", "provider_incomplete", "provider_refusal", "provider_http",
    "provider_timeout", "provider_network", "provider_json", "provider_schema",
    "provider_empty", "provider_unconfigured", "storage_unavailable",
    "persistence_failed", "unexpected_failure"
  ],
  responseStatus: ["completed", "incomplete", "failed", "cancelled", "queued", "in_progress"],
  incompleteReason: ["max_output_tokens", "content_filter", "unknown"],
  providerCode: [
    "rate_limit_exceeded", "insufficient_quota", "invalid_api_key", "invalid_image",
    "invalid_request_error", "server_error", "image_too_large", "context_length_exceeded"
  ],
  providerType: [
    "invalid_request_error", "authentication_error", "rate_limit_error",
    "server_error", "insufficient_quota"
  ],
  stage: [
    "validation", "source_write", "record_create", "reservation", "source_read",
    "provider", "report_validation", "settlement", "record_read"
  ],
  trigger: ["initial", "refine", "retry"],
  mode: ["areaScan", "targetProduct"],
  reasoning: ["none", "minimal", "low", "medium", "high", "xhigh"],
  environment: ["test", "emulator", "unknown"],
  releaseKind: ["commit", "revision", "override", "unknown"],
  // Sprint 012: what an administrator did, never what they saw.
  operation: ["admin.list", "admin.read", "admin.source"],
  accessErrorCode: [
    "unauthorized", "forbidden", "not_found", "method_not_allowed", "cursor_invalid",
    "filter_invalid", "analysis_not_found", "storage_unavailable", "index_unavailable",
    "unexpected_server_error"
  ]
};

export const DIAGNOSTIC_ERROR_CODES = Object.freeze(choices.errorCode);
export const DIAGNOSTIC_ACCESS_ERROR_CODES = Object.freeze(choices.accessErrorCode);

const ids = new Set([
  "requestId", "runId", "analysisId", "providerRequestId", "responseId", "processInstanceId",
  // Hashes of uids: a reference an operator can correlate, not an identity.
  "actorKey", "targetOwnerKey"
]);
const numbers = new Set([
  "httpStatus", "providerStatus", "durationMs", "runNumber", "attempt", "timeoutMs",
  "maxOutputTokens", "retryAfterSeconds", "productRows", "facingTotal", "uncertaintyCount",
  "memoryLimitBytes", "invocationSequence", "processUptimeMs", "imageWidth", "imageHeight", "imageByteLength"
]);
const versions = new Set([
  "requestedModel", "returnedModel", "promptVersion", "schemaVersion",
  "preprocessingVersion", "release"
]);
const usageFields = ["inputTokens", "outputTokens", "cachedTokens", "reasoningTokens"];
// The runner measures the whole provider stage. The adapter measures transport
// through response-body decoding, excluding report parsing and validation.
const durationFields = [...choices.stage, "provider_transport"];

const memoryFields = ["rssBytes", "heapUsedBytes", "heapTotalBytes", "externalBytes", "arrayBuffersBytes"];
const safeNumber = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
function numericFields(value, fields) {
  return Object.fromEntries(fields.map(field => [field, safeNumber(value?.[field]) ? value[field] : null]));
}
function memorySummary(value) {
  return {
    baseline: numericFields(value?.baseline, memoryFields),
    final: numericFields(value?.final, memoryFields),
    sampledMax: numericFields(value?.sampledMax, memoryFields),
    ...numericFields(value, ["sampleCount", "sampleIntervalMs", "samplingFailures"])
  };
}
function rateLimits(value) {
  return Object.fromEntries(["requests", "tokens", "projectTokens"].map(kind => [
    kind, numericFields(value?.[kind], ["limit", "remaining", "resetMs"])
  ]));
}

export function sanitizeDiagnostics(input = {}) {
  const out = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (key === "memorySnapshot" && value && typeof value === "object") {
      out[key] = numericFields(value, memoryFields);
    } else if (key === "memory" && value && typeof value === "object") {
      out[key] = memorySummary(value);
    } else if (key === "rateLimits" && value && typeof value === "object") {
      out[key] = rateLimits(value);
    } else if (key === "firstRequestOnProcess" && typeof value === "boolean") {
      out[key] = value;
    } else if (key === "providerObservedAt" && typeof value === "string"
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
      && Number.isFinite(Date.parse(value))) {
      out[key] = value;
    } else if (key === "trace" && typeof value === "string" && /^[a-f0-9]{32}$/.test(value)) {
      out[key] = value;
    } else if (choices[key]?.includes(value)) {
      out[key] = value;
    } else if (ids.has(key) && typeof value === "string"
      && /^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
      out[key] = value;
    } else if (numbers.has(key) && safeNumber(value)) {
      out[key] = value;
    } else if (versions.has(key) && typeof value === "string"
      && /^[a-zA-Z0-9._-]{1,80}$/.test(value)) {
      out[key] = value;
    } else if (key === "usage" && value && typeof value === "object") {
      out.usage = {};
      for (const field of usageFields) {
        if (Number.isSafeInteger(value[field]) && value[field] >= 0) {
          out.usage[field] = value[field];
        }
      }
    } else if (key === "durations" && value && typeof value === "object") {
      out.durations = {};
      for (const field of durationFields) {
        if (Number.isFinite(value[field]) && value[field] >= 0) {
          out.durations[field] = value[field];
        }
      }
    }
  }
  return out;
}

const events = new Set([
  "request.started", "request.completed", "run.started", "run.completed", "run.failed",
  "stage.started", "stage.completed", "stage.failed", "provider.completed",
  "provider.failed", "persistence.failed", "access.completed"
]);
const routes = /^(?:(GET|POST) \/v1\/agent\/analyses(?:\/\{analysisId\}(?:\/(?:run|source))?)?|GET \/v1\/admin\/analyses(?:\/\{ownerKey\}\/\{analysisId\}(?:\/source)?)?)$/;

export function createDiagnostics(sink = () => {}, defaults = {}) {
  return (event, fields = {}) => {
    try {
      if (!events.has(event)) return;
      const data = { ...defaults, ...fields };
      const envelope = {
        ...sanitizeDiagnostics(data),
        event,
        eventVersion: 1,
        timestamp: new Date().toISOString(),
        service: event === "access.completed" ? "admin" : "agent",
        severity: event.endsWith("failed") || data.httpStatus >= 500 ? "ERROR" : "INFO"
      };
      if (data.route === "unmatched" || routes.test(data.route)) envelope.route = data.route;
      if (/^[a-f0-9]{32}$/.test(data.trace) && /^[a-z][a-z0-9-]{4,62}$/.test(data.project)) {
        envelope["logging.googleapis.com/trace"] = `projects/${data.project}/traces/${data.trace}`;
        if (/^[a-f0-9]{16}$/.test(data.span)) {
          envelope["logging.googleapis.com/spanId"] = data.span;
        }
      }
      const pending = sink(envelope);
      if (pending?.catch) pending.catch(() => {});
    } catch {
      // Telemetry must not become a new business failure.
    }
  };
}
