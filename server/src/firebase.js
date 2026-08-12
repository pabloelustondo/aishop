import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { createFirebaseAPIRouter } from "./firebase-api-router.js";
import { createFirebaseInspectionHandler } from "./firebase-inspection-handler.js";
import { createFirebaseVistaPackageHandler } from "./firebase-vista-package-handler.js";
import { createRequestHandler } from "./http-server.js";
import { createOpenAIAnalyzer } from "./openai-analyzer.js";
import { readVistaStartupLimits } from "./vista-startup-limits.js";

const openAIAPIKey = defineSecret("OPENAI_API_KEY");
const aiShopClientToken = defineSecret("AI_SHOP_CLIENT_TOKEN");
const vistaLimits = readVistaStartupLimits();
let cachedVistaHandler;
const vistaHandler = (request, response) => {
  cachedVistaHandler ??= createFirebaseVistaPackageHandler({ limits: vistaLimits });
  return cachedVistaHandler(request, response);
};

export const api = onRequest({
  region: "northamerica-northeast2",
  secrets: [openAIAPIKey, aiShopClientToken],
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 1,
  concurrency: 1,
  invoker: "public"
}, async (request, response) => {
  const inspectionHandler = (req, res) => createFirebaseInspectionHandler({
    apiKey: openAIAPIKey.value(), model: process.env.OPENAI_MODEL
  })(req, res);
  const legacyHandler = (req, res) => createRequestHandler({
    analyzeProduct: createOpenAIAnalyzer({ apiKey: openAIAPIKey.value(),
      model: process.env.OPENAI_MODEL }), clientToken: aiShopClientToken.value()
  })(req, res);
  await createFirebaseAPIRouter({
    vistaHandler, inspectionHandler, legacyHandler
  })(request, response);
});
