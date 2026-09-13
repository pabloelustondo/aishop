import { sanitizeDiagnostics } from "./agent-diagnostics.js";
import { ANALYSIS_MODES } from "./analysis-contracts.js";
import { AgentEvidenceUnavailableError } from "./agent-evidence-store.js";
import { ProviderError } from "./errors.js";

/** Bounded per-run sampling; counters overlap and are deliberately never summed. */
export function createRunMemorySampler({
  readMemory = () => process.memoryUsage(), setIntervalImpl = setInterval,
  clearIntervalImpl = clearInterval, setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout, signal
} = {}) {
  const keys = { rssBytes: "rss", heapUsedBytes: "heapUsed", heapTotalBytes: "heapTotal",
    externalBytes: "external", arrayBuffersBytes: "arrayBuffers" };
  let baseline = null;
  let final = null;
  const sampledMax = {};
  let sampleCount = 0;
  let samplingFailures = 0;
  let interval;
  let deadline;
  function sample() {
    try {
      const raw = readMemory();
      final = Object.fromEntries(Object.entries(keys).map(([key, source]) => [key,
        Number.isSafeInteger(raw?.[source]) && raw[source] >= 0 ? raw[source] : null]));
      baseline ??= { ...final };
      for (const [key, value] of Object.entries(final)) {
        if (value !== null) sampledMax[key] = Math.max(sampledMax[key] ?? 0, value);
      }
      sampleCount++;
      return { ...final };
    } catch { samplingFailures++; final = null; return null; }
  }
  function stop() {
    if (interval !== undefined) clearIntervalImpl(interval);
    if (deadline !== undefined) clearTimeoutImpl(deadline);
    interval = undefined;
    deadline = undefined;
    signal?.removeEventListener("abort", stop);
  }
  sample();
  if (!signal?.aborted) {
    try {
      interval = setIntervalImpl(sample, 250);
      interval?.unref?.();
      deadline = setTimeoutImpl(stop, 120_000);
      deadline?.unref?.();
      signal?.addEventListener("abort", stop, { once: true });
    } catch { samplingFailures++; stop(); }
  }
  const summary = () => ({ baseline: baseline && { ...baseline }, final: final && { ...final },
    sampledMax: { ...sampledMax }, sampleCount, sampleIntervalMs: 250, samplingFailures });
  return { sample, summary, capture: () => { sample(); return summary(); }, stop };
}

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
  evidenceStore, analysisStore, analyzeProduct, model = null, diagnostics = () => {}, configuration = {}, memorySampling = {}
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
    async run({ ownerKey, analysisId, context = null, diagnosticContext = {}, signal }) {
      const started = performance.now();
      const detail = sanitizeDiagnostics({ ...configuration, ...diagnosticContext, analysisId, attempt: 1 });
      const correlation = { ...diagnosticContext, analysisId };
      const durations = {};
      const sampler = createRunMemorySampler({ ...memorySampling, signal });
      const emit = (event, extra = {}) => {
        const memorySnapshot = sampler.sample();
        try { diagnostics(event, { ...correlation, ...detail, ...extra, memorySnapshot, memory: sampler.summary() }); } catch {}
      };
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
      try {
        const reserved = await stage("reservation", () => analysisStore.markAnalyzing({ ownerKey, analysisId, context, diagnostics: detail }));
        Object.assign(detail, sanitizeDiagnostics({ ...reserved?.diagnostics, runId: reserved?.runId, runNumber: reserved?.runNumber, trigger: reserved?.trigger }));
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
            diagnostics: { ...detail, memory: sampler.capture(), durations: { ...durations, ...detail.durations } } }));
          emit("run.completed", { durationMs: performance.now() - started, durations: { ...durations, ...detail.durations } });
        } catch (error) {
          Object.assign(detail, sanitizeDiagnostics(error.diagnostics));
          detail.failureClass ??= stageName === "settlement" ? "persistence_failed" : error instanceof AgentEvidenceUnavailableError ? "storage_unavailable"
            : error instanceof ProviderError ? (error.kind === "timeout" ? "provider_timeout" : error.kind === "unconfigured" ? "provider_unconfigured" : "provider_network") : "unexpected_failure";
          if (stageName === "provider") emit("provider.failed");
          if (stageName === "settlement") emit("persistence.failed", { stage: "settlement" });
          try {
            await stage("settlement", () => analysisStore.markFailed({ ownerKey, analysisId, runId: reserved?.runId, reason: failureReason(error),
              diagnostics: { ...detail, memory: sampler.capture(), durations: { ...durations, ...detail.durations } } }));
            emit("run.failed", { durationMs: performance.now() - started });
          } catch {
            emit("persistence.failed", { failureClass: "persistence_failed", stage: "settlement" });
          }
          throw error;
        }
        return await stage("record_read", () => analysisStore.read({ ownerKey, analysisId }));
      } finally { sampler.stop(); }
    }
  });
}
