import { sanitizeDiagnostics } from "../../agent-diagnostics.js";
import { assertValidReport } from "../../analysis-contracts.js";
import { ProviderError } from "../../errors.js";

/** Interpret provider state and validate completed output; does not persist it. */
export function interpretBackgroundResponse(payload, mode, diagnostics, { extractMessage, responseId }) {
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
