import { ProviderError } from "./errors.js";
import {
  ANALYSIS_CONTRACTS,
  ANALYSIS_MODES,
  assertValidReport
} from "./analysis-contracts.js";

const RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_MODEL = "gpt-5.4-mini";
export const PRODUCT_INSTRUCTION = ANALYSIS_CONTRACTS.targetProduct.instruction;

function extractMessage(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text.replace(/\s+/g, " ").trim();
  }

  const text = payload?.output
    ?.filter((item) => item?.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part?.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text ?? "";
}

export function createOpenAIAnalyzer({
  apiKey,
  fetchImpl = globalThis.fetch,
  model = DEFAULT_MODEL,
  timeoutMs = 20_000
}) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error("OPENAI_API_KEY is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function.");
  }
  const authorization = `Bearer ${apiKey.trim()}`;

  /**
   * `context` is an optional note from the person who asked for this run —
   * "ignore the top shelf", "count the boxes behind the front row". It is
   * appended after the contract's instruction, never in place of it, so the
   * schema and the counting rules still govern the answer.
   *
   * It exists because re-running an unchanged image against an unchanged
   * prompt buys the same rows at full price. A second run is worth its cost
   * only when the input differs, and this is the cheap way for it to differ.
   *
   * Callers that pass nothing send exactly the request they sent before.
   */
  return async function analyzeProduct({
    imageBase64,
    mediaType,
    mode = ANALYSIS_MODES.targetProduct,
    context = null
  }) {
    const contract = ANALYSIS_CONTRACTS[mode];
    if (!contract) throw new ProviderError("invalid-mode");
    const note = typeof context === "string" && context.trim() !== ""
      ? context.trim() : null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          store: false,
          max_output_tokens: 1_200,
          text: {
            format: {
              type: "json_schema",
              name: contract.schemaName,
              strict: true,
              schema: contract.schema
            }
          },
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: contract.instruction },
              ...(note ? [{
                type: "input_text",
                text: `Additional instruction from the person requesting this analysis: ${note}`
              }] : []),
              {
                type: "input_image",
                image_url: `data:${mediaType};base64,${imageBase64}`,
                detail: "auto"
              }
            ]
          }]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ProviderError("response");
      }

      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        const kind = error?.name === "AbortError" ? "timeout" : "invalid-response";
        throw new ProviderError(kind);
      }

      const message = extractMessage(payload);
      if (!message) {
        throw new ProviderError("empty-response");
      }
      let report;
      try {
        report = JSON.parse(message);
      } catch {
        throw new ProviderError("invalid-response");
      }
      return assertValidReport(mode, report);
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const kind = error?.name === "AbortError" ? "timeout" : "network";
      throw new ProviderError(kind);
    } finally {
      clearTimeout(timeout);
    }
  };
}
