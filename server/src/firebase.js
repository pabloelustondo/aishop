import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { createFirebaseInspectionHandler } from "./firebase-inspection-handler.js";
import { createRequestHandler } from "./http-server.js";
import { createOpenAIAnalyzer } from "./openai-analyzer.js";

const openAIAPIKey = defineSecret("OPENAI_API_KEY");
const aiShopClientToken = defineSecret("AI_SHOP_CLIENT_TOKEN");

export const api = onRequest({
  region: "northamerica-northeast2",
  secrets: [openAIAPIKey, aiShopClientToken],
  timeoutSeconds: 30,
  memory: "256MiB",
  maxInstances: 1,
  concurrency: 1,
  invoker: "public"
}, async (request, response) => {
  const apiKey = openAIAPIKey.value();
  const clientToken = aiShopClientToken.value();
  if (request.url.startsWith("/inspections")) {
    await createFirebaseInspectionHandler({
      apiKey,
      model: process.env.OPENAI_MODEL
    })(request, response);
    return;
  }
  await createRequestHandler({
    analyzeProduct: createOpenAIAnalyzer({ apiKey, model: process.env.OPENAI_MODEL }),
    clientToken
  })(request, response);
});
