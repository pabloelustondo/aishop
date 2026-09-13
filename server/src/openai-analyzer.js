import { createHash } from "node:crypto";
import { sanitizeDiagnostics } from "./agent-diagnostics.js";
import { ProviderError } from "./errors.js";
import {
  ANALYSIS_CONTRACTS,
  ANALYSIS_MODES,
  assertValidReport
} from "./analysis-contracts.js";

const RESPONSES_URL = "https://api.openai.com/v1/responses";
export const MAX_OUTPUT_TOKENS = 1_200;
export const DEFAULT_MODEL = "gpt-5.4-mini";
export const PROVIDER_CONTROL_TIMEOUT_MS = 15_000;
export function analyzerConfiguration(model = DEFAULT_MODEL, mode = "areaScan", timeoutMs = 20_000) {
  const contract = ANALYSIS_CONTRACTS[mode];
  return { requestedModel: model, mode, timeoutMs, maxOutputTokens: MAX_OUTPUT_TOKENS,
    promptVersion: createHash("sha256").update(contract?.instruction ?? "").digest("hex"),
    schemaVersion: createHash("sha256").update(JSON.stringify(contract?.schema ?? {})).digest("hex"),
    preprocessingVersion: "original-image-auto-detail" };
}
export const PRODUCT_INSTRUCTION = ANALYSIS_CONTRACTS.targetProduct.instruction;

function limitCount(value) {
  if (typeof value !== "string" || !/^\d{1,16}$/.test(value)) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) ? count : null;
}

export function rateResetMs(value) {
  if (typeof value !== "string" || value.length > 80) return null;
  const parts = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d)/g)];
  if (!parts.length || parts.map(part => part[0]).join("") !== value) return null;
  const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const total = parts.reduce((sum, part) => sum + Number(part[1]) * units[part[2]], 0);
  return Number.isFinite(total) && total <= 365 * units.d ? total : null;
}

function providerLimits(headers) {
  return Object.fromEntries([
    ["requests", "requests"], ["tokens", "tokens"], ["projectTokens", "project-tokens"]
  ].map(([name, suffix]) => [name, {
    limit: limitCount(headers?.get(`x-ratelimit-limit-${suffix}`)),
    remaining: limitCount(headers?.get(`x-ratelimit-remaining-${suffix}`)),
    resetMs: rateResetMs(headers?.get(`x-ratelimit-reset-${suffix}`))
  }]));
}

function extractMessage(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text.replace(/\s+/g, " ").trim();
  }

  const text = payload?.output
    ?.filter((item) => item?.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part?.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text ?? "";
}

export function createOpenAIAnalyzer({
  apiKey,
  fetchImpl = globalThis.fetch,
  model = DEFAULT_MODEL,
  timeoutMs = 20_000
}) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error("OPENAI_API_KEY is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function.");
  }
  const authorization = `Bearer ${apiKey.trim()}`;

  /**
   * `context` is an optional note from the person who asked for this run —
   * "ignore the top shelf", "count the boxes behind the front row". It is
   * appended after the contract's instruction, never in place of it, so the
   * schema and the counting rules still govern the answer.
   *
   * It exists because re-running an unchanged image against an unchanged
   * prompt buys the same rows at full price. A second run is worth its cost
   * only when the input differs, and this is the cheap way for it to differ.
   *
   * Callers that pass nothing send exactly the request they sent before.
   */
  return async function analyzeProduct({
    imageBase64,
    mediaType,
    mode = ANALYSIS_MODES.targetProduct,
    context = null,
    onDiagnostics = () => {}
  }) {
    const contract = ANALYSIS_CONTRACTS[mode];
    if (!contract) throw new ProviderError("invalid-mode");
    const note = typeof context === "string" && context.trim() !== ""
      ? context.trim() : null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const started = performance.now();
    const diagnostics = analyzerConfiguration(model, mode, timeoutMs);
    let failureClass;
    let validationStarted;
    const notify = () => { try { const pending = onDiagnostics(sanitizeDiagnostics(diagnostics)); pending?.catch?.(() => {}); } catch {} };
    try {
      const response = await fetchImpl(RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          store: false,
          max_output_tokens: MAX_OUTPUT_TOKENS,
          text: {
            format: {
              type: "json_schema",
              name: contract.schemaName,
              strict: true,
              schema: contract.schema
            }
          },
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: contract.instruction },
              ...(note ? [{
                type: "input_text",
                text: `Additional instruction from the person requesting this analysis: ${note}`
              }] : []),
              {
                type: "input_image",
                image_url: `data:${mediaType};base64,${imageBase64}`,
                detail: "auto"
              }
            ]
          }]
        }),
        signal: controller.signal
      });

      diagnostics.providerStatus = response.status;
      diagnostics.providerObservedAt = new Date().toISOString();
      diagnostics.rateLimits = providerLimits(response.headers);
      diagnostics.providerRequestId = response.headers?.get("x-request-id") ?? undefined;
      const retryAfter = response.headers?.get("retry-after");
      if (retryAfter && /^\d+$/.test(retryAfter)) diagnostics.retryAfterSeconds = Number(retryAfter);
      let payload;
      try { payload = await response.json(); }
      catch (error) {
        failureClass = !response.ok ? "provider_http" : "provider_json";
        if (error?.name === "AbortError") { failureClass = "provider_timeout"; throw new ProviderError("timeout"); }
        throw new ProviderError(!response.ok ? "response" : "invalid-response");
      }
      diagnostics.responseStatus = payload?.status;
      diagnostics.incompleteReason = payload?.incomplete_details?.reason;
      diagnostics.returnedModel = payload?.model;
      diagnostics.responseId = payload?.id;
      diagnostics.providerCode = payload?.error?.code;
      diagnostics.providerType = payload?.error?.type;
      diagnostics.usage = payload?.usage ? {
        inputTokens: payload?.usage?.input_tokens, outputTokens: payload?.usage?.output_tokens,
        cachedTokens: payload?.usage?.input_tokens_details?.cached_tokens,
        reasoningTokens: payload?.usage?.output_tokens_details?.reasoning_tokens
      } : undefined;
      diagnostics.durations = { provider_transport: performance.now() - started };
      if (!response.ok || payload?.status === "failed") {
        failureClass = "provider_http"; throw new ProviderError("response");
      }
      if (payload?.status === "incomplete") {
        failureClass = payload.incomplete_details?.reason === "max_output_tokens" ? "provider_output_limit" : "provider_incomplete";
        throw new ProviderError("invalid-response");
      }
      failureClass = "provider_json";
      if (payload?.output?.some(item => item?.content?.some(part => part?.type === "refusal"))) {
        failureClass = "provider_refusal"; throw new ProviderError("invalid-response");
      }
      validationStarted = performance.now();
      const message = extractMessage(payload);
      if (!message) { failureClass = "provider_empty"; throw new ProviderError("empty-response"); }
      let report;
      try { report = JSON.parse(message); }
      catch { failureClass = "provider_json"; throw new ProviderError("invalid-response"); }
      try { assertValidReport(mode, report); }
      catch { failureClass = "provider_schema"; throw new ProviderError("invalid-response"); }
      diagnostics.durations.report_validation = performance.now() - validationStarted;
      notify();
      return report;
    } catch (error) {
      const kind = error instanceof ProviderError ? error.kind : error?.name === "AbortError" ? "timeout" : "network";
      diagnostics.failureClass = kind === "timeout" ? "provider_timeout" : failureClass ?? "provider_network";
      diagnostics.durations ??= { provider_transport: performance.now() - started };
      if (validationStarted !== undefined) diagnostics.durations.report_validation = performance.now() - validationStarted;
      const safe = sanitizeDiagnostics(diagnostics);
      notify();
      throw new ProviderError(kind, safe);
    } finally {
      clearTimeout(timeout);
    }
  };
}

const RESPONSE_ID = /^resp_[A-Za-z0-9_-]{1,120}$/;

/** Short control calls around a provider-owned background analysis. */
export function createOpenAIBackgroundAnalyzer({
  apiKey,
  fetchImpl = globalThis.fetch,
  model = DEFAULT_MODEL,
  timeoutMs = PROVIDER_CONTROL_TIMEOUT_MS
} = {}) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error("OPENAI_API_KEY is required.");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetchImpl must be a function.");
  const authorization = `Bearer ${apiKey.trim()}`;

  function responseId(value) {
    if (typeof value !== "string" || !RESPONSE_ID.test(value)) {
      throw new TypeError("A provider response identifier is required.");
    }
    return value;
  }

  function configuration(mode) {
    const contract = ANALYSIS_CONTRACTS[mode];
    return {
      requestedModel: model, mode, timeoutMs,
      promptVersion: createHash("sha256").update(contract?.instruction ?? "").digest("hex"),
      schemaVersion: createHash("sha256").update(JSON.stringify(contract?.schema ?? {})).digest("hex"),
      preprocessingVersion: "original-image-auto-detail"
    };
  }

  async function request({ method, url, body, mode, onDiagnostics = () => {} }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    timeout?.unref?.();
    const started = performance.now();
    const diagnostics = configuration(mode);
    const notify = () => {
      try { const pending = onDiagnostics(sanitizeDiagnostics(diagnostics)); pending?.catch?.(() => {}); } catch {}
    };
    try {
      const response = await fetchImpl(url, {
        method,
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal
      });
      diagnostics.providerStatus = response.status;
      diagnostics.providerObservedAt = new Date().toISOString();
      diagnostics.rateLimits = providerLimits(response.headers);
      diagnostics.providerRequestId = response.headers?.get("x-request-id") ?? undefined;
      const retryAfter = response.headers?.get("retry-after");
      if (retryAfter && /^\d+$/.test(retryAfter)) diagnostics.retryAfterSeconds = Number(retryAfter);
      let payload;
      try { payload = await response.json(); }
      catch {
        diagnostics.failureClass = response.ok ? "provider_json" : "provider_http";
        throw new ProviderError(response.ok ? "invalid-response" : "response", sanitizeDiagnostics(diagnostics));
      }
      Object.assign(diagnostics, {
        responseStatus: payload?.status,
        incompleteReason: payload?.incomplete_details?.reason,
        returnedModel: payload?.model,
        responseId: payload?.id,
        providerCode: payload?.error?.code,
        providerType: payload?.error?.type,
        usage: payload?.usage ? {
          inputTokens: payload.usage.input_tokens,
          outputTokens: payload.usage.output_tokens,
          cachedTokens: payload.usage.input_tokens_details?.cached_tokens,
          reasoningTokens: payload.usage.output_tokens_details?.reasoning_tokens
        } : undefined,
        durations: { provider_transport: performance.now() - started }
      });
      if (!response.ok) {
        diagnostics.failureClass = "provider_http";
        throw new ProviderError("response", sanitizeDiagnostics(diagnostics));
      }
      return { payload, diagnostics, notify };
    } catch (error) {
      if (error instanceof ProviderError) { notify(); throw error; }
      const timedOut = error?.name === "AbortError";
      diagnostics.failureClass = timedOut ? "provider_timeout" : "provider_network";
      diagnostics.durations ??= { provider_transport: performance.now() - started };
      const safe = sanitizeDiagnostics(diagnostics);
      notify();
      throw new ProviderError(timedOut ? "timeout" : "network", safe);
    } finally { clearTimeout(timeout); }
  }

  function interpret(payload, mode, diagnostics) {
    const status = payload?.status ?? (extractMessage(payload) ? "completed" : null);
    diagnostics.responseStatus = status;
    const id = payload?.id == null ? null : responseId(payload.id);
    if (status === "queued" || status === "in_progress") {
      if (!id) throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_json" }));
      return { status, responseId: id };
    }
    if (status === "incomplete") {
      const failureClass = payload?.incomplete_details?.reason === "max_output_tokens"
        ? "provider_output_limit" : "provider_incomplete";
      throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass }));
    }
    if (status === "failed" || status === "cancelled") {
      throw new ProviderError("response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_http" }));
    }
    if (status !== "completed") {
      throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_json" }));
    }
    if (payload?.output?.some(item => item?.content?.some(part => part?.type === "refusal"))) {
      throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_refusal" }));
    }
    const validationStarted = performance.now();
    const message = extractMessage(payload);
    if (!message) throw new ProviderError("empty-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_empty" }));
    let report;
    try { report = JSON.parse(message); }
    catch { throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_json" })); }
    try { assertValidReport(mode, report); }
    catch { throw new ProviderError("invalid-response", sanitizeDiagnostics({ ...diagnostics, failureClass: "provider_schema" })); }
    diagnostics.durations.report_validation = performance.now() - validationStarted;
    return { status, responseId: id, report };
  }

  async function start({ imageBase64, mediaType, mode = ANALYSIS_MODES.targetProduct,
    context = null, onDiagnostics = () => {} }) {
    const contract = ANALYSIS_CONTRACTS[mode];
    if (!contract) throw new ProviderError("invalid-mode");
    const note = typeof context === "string" && context.trim() !== "" ? context.trim() : null;
    const call = await request({ method: "POST", url: RESPONSES_URL, mode, onDiagnostics, body: {
      model, background: true, store: true,
      text: { format: { type: "json_schema", name: contract.schemaName, strict: true, schema: contract.schema } },
      input: [{ role: "user", content: [
        { type: "input_text", text: contract.instruction },
        ...(note ? [{ type: "input_text", text: `Additional instruction from the person requesting this analysis: ${note}` }] : []),
        { type: "input_image", image_url: `data:${mediaType};base64,${imageBase64}`, detail: "auto" }
      ] }]
    } });
    try { return interpret(call.payload, mode, call.diagnostics); }
    finally { call.notify(); }
  }

  async function retrieve({ responseId: held, mode = ANALYSIS_MODES.areaScan, onDiagnostics = () => {} }) {
    const id = responseId(held);
    const call = await request({ method: "GET", url: `${RESPONSES_URL}/${id}`, mode, onDiagnostics });
    try { return interpret(call.payload, mode, call.diagnostics); }
    finally { call.notify(); }
  }

  async function remove({ responseId: held, mode = ANALYSIS_MODES.areaScan, onDiagnostics = () => {} }) {
    const id = responseId(held);
    const call = await request({ method: "DELETE", url: `${RESPONSES_URL}/${id}`, mode, onDiagnostics });
    call.notify();
    return { deleted: call.payload?.deleted === true };
  }

  return Object.freeze({ start, retrieve, delete: remove, configuration });
}
