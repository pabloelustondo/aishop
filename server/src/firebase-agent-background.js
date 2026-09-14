import { createAgentAnalysisCollector } from "./agent-analysis-collector.js";
import { createAgentCollectionTaskHandler,
  createAgentReconciler } from "./agent-background-functions.js";
import { createAgentTaskEnqueuer } from "./agent-task-enqueuer.js";
import { createFirebaseAgentServices } from "./firebase-services.js";
import { createOpenAIBackgroundAnalyzer,
  DEFAULT_MODEL } from "./openai-analyzer.js";

/** Composes private background handlers without exposing an HTTP collection route. */
export function createFirebaseAgentBackground({ apiKey, model, fetchImpl,
  services: providedServices, taskEnqueuer: providedEnqueuer,
  diagnostics = () => {} } = {}) {
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    throw new Error("OPENAI_API_KEY is required.");
  }
  const services = providedServices ?? createFirebaseAgentServices();
  const taskEnqueuer = providedEnqueuer ?? createAgentTaskEnqueuer();
  const analyzer = createOpenAIBackgroundAnalyzer({ apiKey, model, fetchImpl });
  const collector = createAgentAnalysisCollector({ analysisStore: services.analysisStore,
    analyzer, taskEnqueuer, model: model ?? DEFAULT_MODEL, diagnostics });
  return Object.freeze({
    taskHandler: createAgentCollectionTaskHandler({ collector }),
    reconcile: createAgentReconciler({ dueWorkReader: services.dueWorkReader,
      taskEnqueuer, diagnostics })
  });
}

export function createFirebaseAgentReconciler({ services: providedServices,
  taskEnqueuer: providedEnqueuer, diagnostics = () => {} } = {}) {
  const services = providedServices ?? createFirebaseAgentServices();
  const taskEnqueuer = providedEnqueuer ?? createAgentTaskEnqueuer();
  return createAgentReconciler({ dueWorkReader: services.dueWorkReader,
    taskEnqueuer, diagnostics });
}
