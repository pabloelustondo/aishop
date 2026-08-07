import { ProviderError } from "./errors.js";

const RESPONSES_URL = "https://api.openai.com/v1/responses";
export const DEFAULT_MODEL = "gpt-5.4-mini";
export const PRODUCT_INSTRUCTION = [
  "Identify the main grocery product in this photo.",
  "In one short sentence, name it and describe only visible signs of quality or freshness.",
  "If the product is unclear, say what additional view is needed.",
  "Do not give a buy/skip judgment or invent a price."
].join(" ");

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

  return async function analyzeProduct({ imageBase64, mediaType }) {
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
          max_output_tokens: 100,
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: PRODUCT_INSTRUCTION },
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
      return message;
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const kind = error?.name === "AbortError" ? "timeout" : "network";
      throw new ProviderError(kind);
    } finally {
      clearTimeout(timeout);
    }
  };
}
