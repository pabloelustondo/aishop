import { createAgentAnalysisRunner } from "./agent-analysis-runner.js";
import { createAgentAPIHandler } from "./agent-api-handler.js";
import { createFirebaseAgentServices } from "./firebase-services.js";
import { ProviderError } from "./errors.js";
import { createOpenAIAnalyzer, DEFAULT_MODEL } from "./openai-analyzer.js";

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

export function createFirebaseAgentHandler({ logger = console, apiKey = null, model } = {}) {
  const services = createFirebaseAgentServices();
  const runner = createAgentAnalysisRunner({
    evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore,
    analyzeProduct: apiKey
      ? createOpenAIAnalyzer({ apiKey, model })
      : unconfiguredAnalyzer(),
    model: apiKey ? (model ?? DEFAULT_MODEL) : null
  });
  return createAgentAPIHandler({
    evidenceStore: services.evidenceStore,
    analysisStore: services.analysisStore,
    verifyIdToken: services.verifyIdToken,
    runner,
    logger
  });
}
