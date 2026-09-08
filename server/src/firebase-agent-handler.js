import { agentReleaseMetadata, API_PROCESS_CONTEXT, FUNCTION_MEMORY_BYTES } from "./firebase-agent-config.js";
import * as firebaseLogger from "firebase-functions/logger";
import { createDiagnostics } from "./agent-diagnostics.js";
import { createAgentAnalysisRunner } from "./agent-analysis-runner.js";
import { createAgentAPIHandler } from "./agent-api-handler.js";
import { createFirebaseAgentServices } from "./firebase-services.js";
import { ProviderError } from "./errors.js";
import { createOpenAIAnalyzer, DEFAULT_MODEL, analyzerConfiguration } from "./openai-analyzer.js";

/**
 * Without a key the endpoint still uploads, lists and reads; only a run
 * refuses. It refuses as a provider failure, which is what it is — the record
 * lands in `failed` with a reason a person can act on, rather than the server
 * pretending at start-up that it can analyse and discovering otherwise
 * halfway through somebody's upload.
 */
function unconfiguredAnalyzer() {
  return async () => { throw new ProviderError("unconfigured"); };
}

export function createFirebaseAgentHandler({
  logger = firebaseLogger, apiKey = null, model, fetchImpl, services: providedServices,
  environment = process.env.FUNCTIONS_EMULATOR === "true" ? "emulator" : "test",
  release, releaseKind
} = {}) {
  const releaseMetadata = release
    ? { release, releaseKind: releaseKind ?? "override" }
    : agentReleaseMetadata(process.env);
  const services = providedServices ?? createFirebaseAgentServices();
  const diagnostics = createDiagnostics(event => {
    if (typeof logger.write === "function") return logger.write(event);
    const write = event.severity === "ERROR" ? logger.error : logger.info;
    return write.call(logger, event);
  }, { environment, ...releaseMetadata });
  const runner = createAgentAnalysisRunner({
    evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore,
    analyzeProduct: apiKey
      ? createOpenAIAnalyzer({ apiKey, model, fetchImpl })
      : unconfiguredAnalyzer(),
    model: apiKey ? (model ?? DEFAULT_MODEL) : null,
    diagnostics, configuration: { memoryLimitBytes: FUNCTION_MEMORY_BYTES, ...analyzerConfiguration(model ?? DEFAULT_MODEL), environment, ...releaseMetadata }
  });
  const handler = createAgentAPIHandler({
    evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore,
    verifyIdToken: services.verifyIdToken,
    runner,
    logger, diagnostics
  });
  return (request, response) => handler(request, response, request[API_PROCESS_CONTEXT]);
}
