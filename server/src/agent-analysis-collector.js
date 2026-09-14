import { sanitizeDiagnostics } from "./agent-diagnostics.js";
import { ANALYSIS_MODES } from "./analysis-contracts.js";
import { ProviderError } from "./errors.js";

const MODE = ANALYSIS_MODES.areaScan;

function terminalProviderError(error) {
  return error instanceof ProviderError
    && error.kind !== "timeout" && error.kind !== "network";
}

/** Advances one leased background run; duplicate or stale deliveries are no-ops. */
export function createAgentAnalysisCollector({ analysisStore, analyzer,
  taskEnqueuer, model = null, diagnostics = () => {} } = {}) {
  if (typeof analysisStore?.claimCollection !== "function"
    || typeof analysisStore?.rescheduleCollection !== "function"
    || typeof analysisStore?.markAnalyzed !== "function"
    || typeof analysisStore?.markFailed !== "function") {
    throw new TypeError("A collection-capable analysis store is required.");
  }
  if (typeof analyzer?.retrieve !== "function"
    || typeof analyzer?.delete !== "function") {
    throw new TypeError("A background analysis adapter is required.");
  }
  if (typeof taskEnqueuer?.enqueue !== "function") {
    throw new TypeError("An agent task enqueuer is required.");
  }

  const emit = (event, fields = {}) => {
    try { diagnostics(event, sanitizeDiagnostics(fields)); } catch {}
  };

  async function cleanup(responseId, fields) {
    try {
      await analyzer.delete({ responseId, mode: MODE,
        onDiagnostics: metadata => emit("provider_cleanup.completed",
          { ...fields, ...metadata }) });
    } catch (error) {
      emit("provider_cleanup.failed", { ...fields, ...error?.diagnostics });
    }
  }

  async function enqueueScheduled(identity, scheduled) {
    if (!scheduled?.scheduled) return scheduled;
    try {
      await taskEnqueuer.enqueue({ ...identity, dueAt: scheduled.dueAt });
    } catch (error) {
      emit("task.dispatch_failed", { ...identity,
        failureClass: "task_dispatch_failed" });
    }
    return scheduled;
  }

  return Object.freeze({
    async collect({ ownerKey, analysisId, runId }) {
      const identity = { ownerKey, analysisId, runId };
      const claim = await analysisStore.claimCollection(identity);
      if (!claim.claimed) {
        emit("collection.skipped", { ...identity, reason: claim.reason });
        return Object.freeze({ settled: false, skipped: true, reason: claim.reason });
      }

      const detail = { ...claim.diagnostics };
      try {
        const provider = await analyzer.retrieve({ responseId: claim.responseId,
          mode: MODE, onDiagnostics: metadata => Object.assign(detail,
            sanitizeDiagnostics(metadata)) });
        if (provider.status === "queued" || provider.status === "in_progress") {
          const scheduled = await analysisStore.rescheduleCollection({ ...identity,
            diagnostics: detail });
          await enqueueScheduled(identity, scheduled);
          emit("collection.pending", { ...identity, responseStatus: provider.status });
          return Object.freeze({ settled: false, pending: true });
        }

        const report = provider.report;
        Object.assign(detail, {
          productRows: report.identifiedProducts?.length ?? 0,
          facingTotal: report.identifiedProducts?.reduce((sum, row) =>
            sum + row.count, 0) ?? 0,
          uncertaintyCount: report.uncertainItems?.length ?? 0
        });
        try {
          await analysisStore.markAnalyzed({ ...identity, report,
            model, mode: MODE, diagnostics: detail });
        } catch (error) {
          emit("persistence.failed", { ...identity,
            failureClass: "persistence_failed", stage: "settlement" });
          throw error;
        }
        emit("collection.settled", { ...identity, outcome: "analyzed" });
        await cleanup(claim.responseId, identity);
        return Object.freeze({ settled: true, status: "analyzed" });
      } catch (error) {
        Object.assign(detail, sanitizeDiagnostics(error?.diagnostics));
        if (terminalProviderError(error)) {
          try {
            await analysisStore.markFailed({ ...identity, reason: "provider_failed",
              diagnostics: detail });
          } catch (settlementError) {
            emit("persistence.failed", { ...identity,
              failureClass: "persistence_failed", stage: "settlement" });
            throw settlementError;
          }
          emit("collection.settled", { ...identity, outcome: "failed" });
          await cleanup(claim.responseId, identity);
          return Object.freeze({ settled: true, status: "failed" });
        }
        if (error instanceof ProviderError) {
          const scheduled = await analysisStore.rescheduleCollection({ ...identity,
            diagnostics: detail });
          await enqueueScheduled(identity, scheduled);
          emit("collection.deferred", { ...identity,
            failureClass: detail.failureClass });
          return Object.freeze({ settled: false, pending: true });
        }
        throw error;
      }
    }
  });
}
