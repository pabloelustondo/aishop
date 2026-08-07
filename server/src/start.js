import { createHttpServer } from "./http-server.js";
import { createOpenAIAnalyzer } from "./openai-analyzer.js";

function positiveInteger(value, fallback, name) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

const host = process.env.HOST ?? "0.0.0.0";
const port = positiveInteger(process.env.PORT, 3000, "PORT");
const timeoutMs = positiveInteger(process.env.OPENAI_TIMEOUT_MS, 20_000, "OPENAI_TIMEOUT_MS");
const analyzeProduct = createOpenAIAnalyzer({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
  timeoutMs
});
const server = createHttpServer({
  analyzeProduct,
  clientToken: process.env.AI_SHOP_CLIENT_TOKEN
});

server.listen(port, host, () => {
  console.log(`AI Shop server listening on http://${host}:${port}`);
});

server.on("error", () => {
  console.error("AI Shop server could not start.");
  process.exitCode = 1;
});
