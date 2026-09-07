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
  evidenceStore, analysisStore, analyzeProduct, model = null
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
    async run({ ownerKey, analysisId, context = null }) {
      await analysisStore.markAnalyzing({ ownerKey, analysisId, context });
      try {
        const source = await evidenceStore.readSource({ ownerKey, analysisId });
        const report = await analyzeProduct({
          imageBase64: source.bytes.toString("base64"),
          mediaType: source.mediaType ?? "image/jpeg",
          mode: MODE,
          context
        });
        await analysisStore.markAnalyzed({
          ownerKey, analysisId, report, model, mode: MODE
        });
      } catch (error) {
        await analysisStore.markFailed({
          ownerKey, analysisId, reason: failureReason(error)
        });
        throw error;
      }
      return analysisStore.read({ ownerKey, analysisId });
    }
  });
}
