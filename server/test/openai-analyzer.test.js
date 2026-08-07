import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ProviderError } from "../src/errors.js";
import {
  createOpenAIAnalyzer,
  DEFAULT_MODEL,
  PRODUCT_INSTRUCTION
} from "../src/openai-analyzer.js";

const tinyJpegBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url),
  "utf8"
).replace(/\s+/g, "");

const image = {
  imageBase64: tinyJpegBase64,
  mediaType: "image/jpeg"
};

function responseJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

test("sends the image and fixed instruction to the Responses API", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return responseJson({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: "  Fresh red tomatoes.\n" }]
      }]
    });
  };
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });

  assert.equal(await analyze(image), "Fresh red tomatoes.");
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-api-key");

  const body = JSON.parse(request.options.body);
  assert.equal(body.model, DEFAULT_MODEL);
  assert.equal(body.store, false);
  assert.equal(body.input[0].content[0].text, PRODUCT_INSTRUCTION);
  assert.equal(
    body.input[0].content[1].image_url,
    `data:image/jpeg;base64,${image.imageBase64}`
  );
});

test("maps non-success and empty provider responses to provider errors", async () => {
  const cases = [
    async () => responseJson({ error: { message: "rate limited" } }, 429),
    async () => responseJson({ output: [] })
  ];

  for (const fetchImpl of cases) {
    const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
    await assert.rejects(analyze(image), ProviderError);
  }
});

test("aborts a provider request after the configured timeout", async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });
  const analyze = createOpenAIAnalyzer({
    apiKey: "test-api-key",
    fetchImpl,
    timeoutMs: 5
  });

  await assert.rejects(
    analyze(image),
    (error) => error instanceof ProviderError && error.kind === "timeout"
  );
});
