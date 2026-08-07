import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
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
  const handleRequest = createRequestHandler({
    analyzeProduct: createOpenAIAnalyzer({
      apiKey: openAIAPIKey.value(),
      model: process.env.OPENAI_MODEL
    }),
    clientToken: aiShopClientToken.value()
  });
  await handleRequest(request, response);
});
