import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ProviderError } from "../src/errors.js";
import {
  createOpenAIAnalyzer,
  DEFAULT_MODEL,
  PRODUCT_INSTRUCTION
} from "../src/openai-analyzer.js";
import { ANALYSIS_CONTRACTS, ANALYSIS_MODES } from "../src/analysis-contracts.js";

const tinyJpegBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url),
  "utf8"
).replace(/\s+/g, "");

const image = {
  imageBase64: tinyJpegBase64,
  mediaType: "image/jpeg"
};

const targetReport = {
  productName: "Tomatoes",
  summary: "Fresh red tomatoes are visible.",
  visibleEvidence: ["Red color", "Firm-looking skin"],
  missingInformation: ["Price is not visible"],
  conclusion: "insufficient_evidence",
  conclusionReason: "Price and freshness cannot be fully verified.",
  confidence: "medium"
};

const areaReport = {
  summary: "Two products are clearly visible.",
  identifiedProducts: [{
    name: "Tomatoes",
    visibleEvidence: ["Red tomatoes in a produce bin"],
    confidence: "high"
  }],
  uncertainItems: [{ description: "Green package", reason: "Label is obscured" }]
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
        content: [{ type: "output_text", text: JSON.stringify(targetReport) }]
      }]
    });
  };
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });

  assert.deepEqual(await analyze(image), targetReport);
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer test-api-key");

  const body = JSON.parse(request.options.body);
  assert.equal(body.model, DEFAULT_MODEL);
  assert.equal(body.store, false);
  assert.equal(body.input[0].content[0].text, PRODUCT_INSTRUCTION);
  assert.deepEqual(body.text.format, {
    type: "json_schema",
    name: "target_product_report",
    strict: true,
    schema: ANALYSIS_CONTRACTS.targetProduct.schema
  });
  assert.equal(
    body.input[0].content[1].image_url,
    `data:image/jpeg;base64,${image.imageBase64}`
  );
});

test("uses a separate strict contract for an area scan", async () => {
  let requestBody;
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return responseJson({ output_text: JSON.stringify(areaReport) });
  };
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });

  assert.deepEqual(
    await analyze({ ...image, mode: ANALYSIS_MODES.areaScan }),
    areaReport
  );
  assert.equal(requestBody.input[0].content[0].text, ANALYSIS_CONTRACTS.areaScan.instruction);
  assert.equal(requestBody.text.format.name, "area_scan_report");
  assert.deepEqual(requestBody.text.format.schema, ANALYSIS_CONTRACTS.areaScan.schema);
});

test("maps non-success and empty provider responses to provider errors", async () => {
  const cases = [
    async () => responseJson({ error: { message: "rate limited" } }, 429),
    async () => responseJson({ output: [] }),
    async () => responseJson({ output_text: "not-json" }),
    async () => responseJson({ output_text: JSON.stringify({ summary: "incomplete" }) })
  ];

  for (const fetchImpl of cases) {
    const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
    await assert.rejects(analyze(image), ProviderError);
  }
});

test("rejects an area response with more than 12 identified products", async () => {
  const tooManyProducts = Array.from({ length: 13 }, (_, index) => ({
    name: `Product ${index + 1}`,
    visibleEvidence: ["Visible package"],
    confidence: "medium"
  }));
  const fetchImpl = async () => responseJson({
    output_text: JSON.stringify({
      summary: "Too many products",
      identifiedProducts: tooManyProducts,
      uncertainItems: []
    })
  });
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });

  await assert.rejects(
    analyze({ ...image, mode: ANALYSIS_MODES.areaScan }),
    ProviderError
  );
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
