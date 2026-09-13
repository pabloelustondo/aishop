import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { createFirebaseAdminHandler } from "./firebase-admin-handler.js";
import { createFirebaseAgentHandler } from "./firebase-agent-handler.js";
import { agentAPIKey, FUNCTION_MEMORY, API_PROCESS_CONTEXT, createProcessContext } from "./firebase-agent-config.js";
import { createFirebaseAPIRouter } from "./firebase-api-router.js";
import { createFirebaseInspectionHandler } from "./firebase-inspection-handler.js";
import { createFirebaseVistaPackageHandler } from "./firebase-vista-package-handler.js";
import { createFirebaseVistaReadHandler } from "./firebase-vista-read-handler.js";
import { createRequestHandler } from "./http-server.js";
import { createOpenAIAnalyzer } from "./openai-analyzer.js";
import { readVistaStartupLimits } from "./vista-startup-limits.js";

const openAIAPIKey = defineSecret("OPENAI_API_KEY");
const aiShopClientToken = defineSecret("AI_SHOP_CLIENT_TOKEN");
const nextProcessContext = createProcessContext();
const vistaLimits = readVistaStartupLimits();
let cachedVistaHandler;
const vistaHandler = (request, response) => {
  cachedVistaHandler ??= createFirebaseVistaPackageHandler({ limits: vistaLimits });
  return cachedVistaHandler(request, response);
};
let cachedVistaReadHandler;
const vistaReadHandler = (request, response) => {
  // Built on first request, not at module load: a secret's value is only
  // resolvable inside an invocation.
  cachedVistaReadHandler ??= createFirebaseVistaReadHandler({
    apiKey: openAIAPIKey.value(), model: process.env.OPENAI_MODEL
  });
  return cachedVistaReadHandler(request, response);
};

let cachedAgentHandler;
const agentHandler = (request, response) => {
  // Built on first request for the same reason as the VISTA reader: a
  // secret's value is only resolvable inside an invocation.
  cachedAgentHandler ??= createFirebaseAgentHandler({
    apiKey: agentAPIKey(process.env, () => openAIAPIKey.value()),
    model: process.env.OPENAI_MODEL
  });
  return cachedAgentHandler(request, response);
};

let cachedAdminHandler;
const adminHandler = (request, response) => {
  cachedAdminHandler ??= createFirebaseAdminHandler();
  return cachedAdminHandler(request, response);
};

export const api = onRequest({
  region: "northamerica-northeast2",
  secrets: [openAIAPIKey, aiShopClientToken],
  // Raised with max_output_tokens: a full 25-product shelf answer generates
  // several thousand tokens, and 30 s left no margin over the provider call.
  // A timeout discards a completed OpenAI charge and returns nothing.
  timeoutSeconds: 120,
  memory: FUNCTION_MEMORY,
  maxInstances: 1,
  concurrency: 1,
  invoker: "public"
}, async (request, response) => {
  request[API_PROCESS_CONTEXT] = nextProcessContext();
  const inspectionHandler = (req, res) => createFirebaseInspectionHandler({
    apiKey: openAIAPIKey.value(), model: process.env.OPENAI_MODEL
  })(req, res);
  const legacyHandler = (req, res) => createRequestHandler({
    analyzeProduct: createOpenAIAnalyzer({ apiKey: openAIAPIKey.value(),
      model: process.env.OPENAI_MODEL }), clientToken: aiShopClientToken.value()
  })(req, res);
  await createFirebaseAPIRouter({
    vistaHandler, vistaReadHandler, agentHandler, adminHandler, inspectionHandler, legacyHandler
  })(request, response);
});
