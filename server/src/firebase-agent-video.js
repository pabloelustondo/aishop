import * as firebaseLogger from "firebase-functions/logger";
import { createDiagnostics } from "./agent-diagnostics.js";
import { createAgentAnalysisRunner } from "./agent-analysis-runner.js";
import { createAgentTaskEnqueuer } from "./agent-task-enqueuer.js";
import { createAgentVideoProcessor } from "./agent-video-processor.js";
import { readVideoTaskPayload } from "./agent-video-task-enqueuer.js";
import { FUNCTION_MEMORY_BYTES } from "./firebase-agent-config.js";
import { createFirebaseAgentServices } from "./firebase-services.js";
import { createOpenAIBackgroundAnalyzer } from "./openai-analyzer.js";

export function createFirebaseAgentVideo({ apiKey, model, fetchImpl,
  services: providedServices, diagnostics: providedDiagnostics,
  taskEnqueuer } = {}) {
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    throw new Error("OPENAI_API_KEY is required.");
  }
  const services = providedServices ?? createFirebaseAgentServices();
  const diagnostics = providedDiagnostics ?? createDiagnostics(event => {
    const write = event.severity === "ERROR" ? firebaseLogger.error : firebaseLogger.info;
    return write.call(firebaseLogger, event);
  }, { environment: process.env.FUNCTIONS_EMULATOR === "true" ? "emulator" : "test" });
  const analyzer = createOpenAIBackgroundAnalyzer({ apiKey, model, fetchImpl });
  const runner = createAgentAnalysisRunner({ evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore, analyzer,
    taskEnqueuer: taskEnqueuer ?? createAgentTaskEnqueuer(), diagnostics,
    configuration: { ...analyzer.configuration("videoAreaScan"),
      memoryLimitBytes: FUNCTION_MEMORY_BYTES } });
  const processor = createAgentVideoProcessor({ evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore, runner, diagnostics });
  return Object.freeze({ taskHandler: request =>
    processor.process(readVideoTaskPayload(request?.data)) });
}
