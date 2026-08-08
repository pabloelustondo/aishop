import { assertValidReport } from "./analysis-contracts.js";
import { ProviderError } from "./errors.js";
import { buildInspectionAnalysisRequest } from "./inspection-analysis-request.js";
import { DEFAULT_MODEL } from "./openai-analyzer.js";

const RESPONSES_URL = "https://api.openai.com/v1/responses";

function parseReport(payload, mode) {
  const text = payload?.output_text ?? payload?.output
    ?.flatMap((item) => item?.content ?? [])
    .find((part) => part?.type === "output_text")?.text;
  if (typeof text !== "string" || text.trim() === "") {
    throw new ProviderError("empty-response");
  }
  try {
    return assertValidReport(mode, JSON.parse(text));
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("invalid-response");
  }
}

export function createInspectionAnalysisAdapter({ apiKey, fetchImpl = globalThis.fetch,
  model = DEFAULT_MODEL, timeoutMs = 20_000 }) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error("OPENAI_API_KEY is required.");
  }
  return async function analyze(submission) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildInspectionAnalysisRequest(submission, model)),
        signal: controller.signal
      });
      if (!response.ok) throw new ProviderError("response");
      return parseReport(await response.json(), submission.mode);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(error?.name === "AbortError" ? "timeout" : "network");
    } finally {
      clearTimeout(timeout);
    }
  };
}
