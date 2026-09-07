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
import { VISTA_CATALOG, catalogProductIds } from "../src/vista-catalog.js";

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
    count: 3,
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

test("accepts a well-stocked shelf that the old 12-product gate would have refused", async () => {
  // Regression: the response schema was raised to 40 while assertValidReport
  // still said 12, so a 13-product answer passed the model and was then thrown
  // out here as invalid-response — a 502 on exactly the shelves the raise was
  // made for. 20 is a plausible CeraVe bay.
  const wellStocked = Array.from({ length: 20 }, (_, index) => ({
    name: `Product ${index + 1}`,
    count: index + 1,
    visibleEvidence: ["Visible package"],
    confidence: "high"
  }));
  const fetchImpl = async () => responseJson({
    output_text: JSON.stringify({
      summary: "A full bay.",
      identifiedProducts: wellStocked,
      uncertainItems: []
    })
  });
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
  const report = await analyze({ ...image, mode: ANALYSIS_MODES.areaScan });
  assert.equal(report.identifiedProducts.length, 20);
  assert.equal(report.identifiedProducts[19].count, 20);
});

test("rejects an area response with more than 40 identified products", async () => {
  // 40 is the ceiling: above the full CeraVe Argentina range of 25, with room
  // for a second brand in the same frame.
  const tooManyProducts = Array.from({ length: 41 }, (_, index) => ({
    name: `Product ${index + 1}`,
    count: 1,
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

test("the closed-world contract can only name catalog products", () => {
  const contract = ANALYSIS_CONTRACTS[ANALYSIS_MODES.areaScanCatalog];
  const allowed = contract.schema.properties.identifiedProducts.items.properties.productId.enum;
  // The enum IS the constraint. Open-world naming produced a plausible CeraVe
  // cleanser that is neither on the shelf nor in the catalog; this makes that
  // answer unrepresentable rather than merely discouraged.
  assert.deepEqual(allowed.slice().sort(), catalogProductIds().slice().sort());
  assert.ok(allowed.includes("UNKNOWN"), "refusal must remain expressible");
  // Every catalog product must be nameable in the prompt, or the model cannot
  // map a pack to the id it is required to answer with.
  for (const product of VISTA_CATALOG.products) {
    assert.ok(contract.instruction.includes(product.id), `roster omits ${product.id}`);
  }
});

test("a closed-world answer outside the catalog is refused", async () => {
  const outside = {
    summary: "One product.",
    identifiedProducts: [{
      productId: "CER-CLE-ACNE-FOAMING",
      readAs: "Acne Foaming Cream Cleanser",
      count: 1,
      visibleEvidence: ["Boxed product"],
      confidence: "high"
    }],
    uncertainItems: []
  };
  const fetchImpl = async () => responseJson({ output_text: JSON.stringify(outside) });
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
  await assert.rejects(
    analyze({ ...image, mode: ANALYSIS_MODES.areaScanCatalog }),
    ProviderError
  );
});

test("UNKNOWN carries its own facing count", async () => {
  const report = {
    summary: "Five units, two unmatched.",
    identifiedProducts: [
      { productId: "CER-MOI-CREAM-340", readAs: "Moisturising Cream",
        count: 3, visibleEvidence: ["Tub"], confidence: "high" },
      { productId: "UNKNOWN", readAs: "boxed product, label unreadable",
        count: 2, visibleEvidence: ["Carton"], confidence: "low" }
    ],
    uncertainItems: []
  };
  const fetchImpl = async () => responseJson({ output_text: JSON.stringify(report) });
  const analyze = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
  const result = await analyze({ ...image, mode: ANALYSIS_MODES.areaScanCatalog });
  assert.equal(result.identifiedProducts.reduce((n, p) => n + p.count, 0), 5);
});

test("appends a caller's context as its own instruction after the contract's", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return responseJson({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(areaReport) }]
      }]
    });
  };
  const analyze = createOpenAIAnalyzer({ apiKey: "k", fetchImpl });

  await analyze({
    ...image,
    mode: ANALYSIS_MODES.areaScan,
    context: "  Ignore the top shelf; it is a different bay.  "
  });

  const body = JSON.parse(request.options.body);
  const texts = body.input[0].content
    .filter((part) => part.type === "input_text")
    .map((part) => part.text);
  assert.equal(texts.length, 2, "the contract instruction is not replaced, only followed");
  assert.equal(texts[0], ANALYSIS_CONTRACTS[ANALYSIS_MODES.areaScan].instruction);
  assert.match(texts[1], /Ignore the top shelf; it is a different bay\.$/,
    "the note is trimmed and sent as given");
  assert.equal(body.input[0].content.at(-1).type, "input_image",
    "the image stays last so both instructions precede it");
});

test("sends only the contract instruction when a caller passes no context", async () => {
  const bodies = [];
  const fetchImpl = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return responseJson({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(areaReport) }]
      }]
    });
  };
  const analyze = createOpenAIAnalyzer({ apiKey: "k", fetchImpl });

  await analyze({ ...image, mode: ANALYSIS_MODES.areaScan });
  await analyze({ ...image, mode: ANALYSIS_MODES.areaScan, context: "   " });
  await analyze({ ...image, mode: ANALYSIS_MODES.areaScan, context: 42 });

  for (const body of bodies) {
    const texts = body.input[0].content.filter((part) => part.type === "input_text");
    assert.equal(texts.length, 1,
      "an absent, blank, or non-string note must not become an empty instruction");
    assert.equal(texts[0].text, ANALYSIS_CONTRACTS[ANALYSIS_MODES.areaScan].instruction);
  }
});
