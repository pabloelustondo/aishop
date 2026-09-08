import { sanitizeDiagnostics } from "./agent-diagnostics.js";
import { ANALYSIS_MODES } from "./analysis-contracts.js";
import { AgentEvidenceUnavailableError } from "./agent-evidence-store.js";
import { ProviderError } from "./errors.js";

/** Open world. Catalog matching is a later increment, not a flag here. */
const MODE = ANALYSIS_MODES.areaScan;

/**
 * Why a run failed, in terms the list page can show a person. A provider
 * timeout and an unreadable object are different problems with different
 * remedies, so they are never collapsed into one reason.
 */
function failureReason(error) {
  if (error instanceof AgentEvidenceUnavailableError) return "storage_unavailable";
  if (error instanceof ProviderError) {
    return error.kind === "timeout" ? "provider_timeout" : "provider_failed";
  }
  return "unexpected_failure";
}

/**
 * Runs the analysis for one already-uploaded still.
 *
 * The record is moved to `analyzing` before the source is read and before the
 * provider is called, so a run that dies mid-flight is visible as started
 * rather than indistinguishable from one never attempted. Every failure path
 * writes a reason onto the record: a run that vanishes silently is the one
 * thing this component must not do.
 *
 * The error is re-thrown after being recorded. The caller decides the HTTP
 * answer; this component only makes sure the record tells the truth first.
 *
 * A run may carry a `context` note. The first run never does — there is
 * nothing for a person to add before seeing an answer. A later run against an
 * already analysed image is worth its cost only because the note changes what
 * is being asked, so the note travels with the run rather than beside it.
 */
export function createAgentAnalysisRunner({
  evidenceStore, analysisStore, analyzeProduct, model = null, diagnostics = () => {}, configuration = {}
} = {}) {
  if (typeof evidenceStore?.readSource !== "function") {
    throw new TypeError("An agent evidence store is required.");
  }
  if (typeof analysisStore?.markAnalyzing !== "function") {
    throw new TypeError("An agent analysis store is required.");
  }
  if (typeof analyzeProduct !== "function") {
    throw new TypeError("An analysis function is required.");
  }

  return Object.freeze({
    async run({ ownerKey, analysisId, context = null, diagnosticContext = {} }) {
      const started = performance.now();
      const detail = sanitizeDiagnostics({ ...configuration, ...diagnosticContext, analysisId, attempt: 1 });
      const correlation = { ...diagnosticContext, analysisId };
      const durations = {};
      const emit = (event, extra = {}) => { try { diagnostics(event, { ...correlation, ...detail, ...extra }); } catch {} };
      async function stage(name, operation) {
        const start = performance.now();
        emit("stage.started", { stage: name });
        try {
          const value = await operation();
          durations[name] = performance.now() - start;
          emit("stage.completed", { stage: name, durationMs: durations[name] });
          return value;
        } catch (error) {
          durations[name] = performance.now() - start;
          emit("stage.failed", { stage: name, durationMs: durations[name] });
          throw error;
        }
      }
      const reserved = await stage("reservation", () => analysisStore.markAnalyzing({ ownerKey, analysisId, context, diagnostics: detail }));
      Object.assign(detail, sanitizeDiagnostics({ runId: reserved?.runId, runNumber: reserved?.runNumber, trigger: reserved?.trigger }));
      emit("run.started");
      let stageName = "source_read";
      try {
        const source = await stage(stageName, () => evidenceStore.readSource({ ownerKey, analysisId }));
        stageName = "provider";
        const report = await stage(stageName, () => analyzeProduct({
          imageBase64: source.bytes.toString("base64"), mediaType: source.mediaType ?? "image/jpeg", mode: MODE, context,
          onDiagnostics: metadata => Object.assign(detail, sanitizeDiagnostics(metadata))
        }));
        emit("provider.completed", { durationMs: durations.provider });
        stageName = "settlement";
        Object.assign(detail, { productRows: report.identifiedProducts?.length ?? 0,
          facingTotal: report.identifiedProducts?.reduce((sum, row) => sum + row.count, 0) ?? 0,
          uncertaintyCount: report.uncertainItems?.length ?? 0 });
        await stage(stageName, () => analysisStore.markAnalyzed({ ownerKey, analysisId, runId: reserved?.runId, report, model, mode: MODE,
          diagnostics: { ...detail, durations: { ...durations, ...detail.durations } } }));
        emit("run.completed", { durationMs: performance.now() - started, durations: { ...durations, ...detail.durations } });
      } catch (error) {
        Object.assign(detail, sanitizeDiagnostics(error.diagnostics));
        detail.failureClass ??= stageName === "settlement" ? "persistence_failed" : error instanceof AgentEvidenceUnavailableError ? "storage_unavailable"
          : error instanceof ProviderError ? (error.kind === "timeout" ? "provider_timeout" : error.kind === "unconfigured" ? "provider_unconfigured" : "provider_network") : "unexpected_failure";
        if (stageName === "provider") emit("provider.failed");
        if (stageName === "settlement") emit("persistence.failed", { stage: "settlement" });
        try {
          await stage("settlement", () => analysisStore.markFailed({ ownerKey, analysisId, runId: reserved?.runId, reason: failureReason(error),
            diagnostics: { ...detail, durations: { ...durations, ...detail.durations } } }));
          emit("run.failed", { durationMs: performance.now() - started });
        } catch {
          emit("persistence.failed", { failureClass: "persistence_failed", stage: "settlement" });
        }
        throw error;
      }
      return stage("record_read", () => analysisStore.read({ ownerKey, analysisId }));
    }
  });
}
