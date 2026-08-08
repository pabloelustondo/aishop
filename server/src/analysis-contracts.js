import { ClientError, ERROR_MESSAGES, ProviderError } from "./errors.js";

export const ANALYSIS_MODES = Object.freeze({
  targetProduct: "targetProduct",
  areaScan: "areaScan"
});

const confidence = { type: "string", enum: ["high", "medium", "low"] };
const stringList = { type: "array", items: { type: "string" } };

const targetProductSchema = {
  type: "object",
  additionalProperties: false,
  required: ["productName", "summary", "visibleEvidence", "missingInformation", "conclusion", "conclusionReason", "confidence"],
  properties: {
    productName: { type: "string" },
    summary: { type: "string" },
    visibleEvidence: stringList,
    missingInformation: stringList,
    conclusion: { type: "string", enum: ["good_buy", "bad_buy", "insufficient_evidence"] },
    conclusionReason: { type: "string" },
    confidence
  }
};

const areaScanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "identifiedProducts", "uncertainItems"],
  properties: {
    summary: { type: "string" },
    identifiedProducts: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "visibleEvidence", "confidence"],
        properties: { name: { type: "string" }, visibleEvidence: stringList, confidence }
      }
    },
    uncertainItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "reason"],
        properties: { description: { type: "string" }, reason: { type: "string" } }
      }
    }
  }
};

export const ANALYSIS_CONTRACTS = Object.freeze({
  [ANALYSIS_MODES.targetProduct]: {
    schemaName: "target_product_report",
    schema: targetProductSchema,
    instruction: [
      "Analyze the single product at the exact center crosshair of the image.",
      "Use the rest of the frame only as supporting context such as visible price, barcode, packaging, or condition.",
      "Report only visible evidence and explicitly list missing information.",
      "Use insufficient_evidence unless the visible evidence supports a good_buy or bad_buy conclusion."
    ].join(" ")
  },
  [ANALYSIS_MODES.areaScan]: {
    schemaName: "area_scan_report",
    schema: areaScanSchema,
    instruction: [
      "Analyze the shelf, display, bin, or shopping area visible in the full image.",
      "Identify up to 12 distinct products using only visible evidence.",
      "Keep uncertain items separate and explain why each is uncertain.",
      "Do not invent brands, prices, product details, or buying conclusions."
    ].join(" ")
  }
});

export function validateAnalysisMode(mode) {
  if (!Object.values(ANALYSIS_MODES).includes(mode)) {
    throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
  }
  return mode;
}

function isStringList(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function assertValidReport(mode, report) {
  const confidenceValues = ["high", "medium", "low"];
  const validTarget = mode === ANALYSIS_MODES.targetProduct
    && report && typeof report.productName === "string"
    && typeof report.summary === "string"
    && isStringList(report.visibleEvidence)
    && isStringList(report.missingInformation)
    && ["good_buy", "bad_buy", "insufficient_evidence"].includes(report.conclusion)
    && typeof report.conclusionReason === "string"
    && confidenceValues.includes(report.confidence);
  const validArea = mode === ANALYSIS_MODES.areaScan
    && report && typeof report.summary === "string"
    && Array.isArray(report.identifiedProducts) && report.identifiedProducts.length <= 12
    && report.identifiedProducts.every((item) => item && typeof item.name === "string"
      && isStringList(item.visibleEvidence) && confidenceValues.includes(item.confidence))
    && Array.isArray(report.uncertainItems)
    && report.uncertainItems.every((item) => item && typeof item.description === "string"
      && typeof item.reason === "string");
  if (!validTarget && !validArea) throw new ProviderError("invalid-response");
  return report;
}
