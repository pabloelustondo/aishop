import { ClientError, ERROR_MESSAGES, ProviderError } from "./errors.js";
import { VISTA_CATALOG, catalogProductIds, catalogRoster } from "./vista-catalog.js";

export const ANALYSIS_MODES = Object.freeze({
  targetProduct: "targetProduct",
  areaScan: "areaScan",
  /// Closed world: the answer may only name products the catalog knows, or
  /// refuse. A separate mode rather than a flag on `areaScan`, because AI
  /// Shop's own app asks the open-world question about any shelf anywhere and
  /// must keep getting a free-text answer.
  areaScanCatalog: "areaScanCatalog"
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
      // A shelf can legitimately carry every product a brand sells. The whole
      // CeraVe Argentina range is 25, so a cap of 12 silently truncated the
      // answer on any well-stocked shelf and made a complete count impossible
      // to express. 40 sits above the full range with room for a second brand
      // in frame, and matches VISTA_MAX_ARTIFACTS so one photo's answer cannot
      // outgrow one package's evidence.
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        // `count` is the whole point of asking a model about a shelf rather
        // than about a product: names say what is stocked, facings say how
        // much. Every property must also be required — the provider's strict
        // structured-output mode rejects a schema with optional fields.
        required: ["name", "count", "visibleEvidence", "confidence"],
        properties: {
          name: { type: "string" },
          count: { type: "integer" },
          visibleEvidence: stringList,
          confidence
        }
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

const catalogScanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "identifiedProducts", "uncertainItems"],
  properties: {
    summary: { type: "string" },
    identifiedProducts: {
      type: "array",
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["productId", "readAs", "count", "visibleEvidence", "confidence"],
        properties: {
          // The enum is the whole point. Open-world naming invented a
          // "CeraVe Acne Foaming Cream Cleanser" from a carton read at an
          // angle — a plausible product that is not on the shelf and not in
          // the catalog. An enum makes that answer unrepresentable.
          productId: { enum: catalogProductIds() },
          // What it actually read off the pack, kept beside the match so a
          // reviewer can see WHY it resolved the way it did — and so a wrong
          // match is diagnosable rather than just wrong.
          readAs: { type: "string" },
          count: { type: "integer" },
          visibleEvidence: stringList,
          confidence
        }
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
      "Identify every distinct product visible, using only visible evidence.",
      "For each one report count: how many separate front-facing units of that "
      + "product are visible. Count FACINGS — units presented to the front — "
      + "not stacked depth behind them, and not units you infer are there.",
      "Keep uncertain items separate and explain why each is uncertain.",
      "Do not invent brands, prices, product details, or buying conclusions."
    ].join(" ")
  },
  [ANALYSIS_MODES.areaScanCatalog]: {
    schemaName: "area_scan_catalog_report",
    schema: catalogScanSchema,
    instruction: [
      "Analyze the shelf, display, bin, or shopping area visible in the full image.",
      "You may ONLY report products from this catalog:",
      "\n" + catalogRoster() + "\n",
      `Every row's productId must be one of those identifiers or ${VISTA_CATALOG.unknownLabel}.`,
      "Never invent a product, and never use a name that is not in the catalog:",
      "a facing you cannot confidently match is",
      `${VISTA_CATALOG.unknownLabel}, which is a correct answer, not a failure.`,
      "In readAs, put the text you actually read off that pack, in its own words.",
      "For each row report count: how many separate front-facing units it covers.",
      "Count FACINGS — units presented to the front — not stacked depth behind",
      "them, and not units you infer are there.",
      "One physical unit can show different faces in different languages;",
      "that is still ONE product, so do not split it into two rows.",
      `Report ${VISTA_CATALOG.unknownLabel} once, with the total count of facings you could not match.`
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
    && Array.isArray(report.identifiedProducts) && report.identifiedProducts.length <= 40
    && report.identifiedProducts.every((item) => item && typeof item.name === "string"
      && Number.isInteger(item.count) && item.count >= 0
      && isStringList(item.visibleEvidence) && confidenceValues.includes(item.confidence))
    && Array.isArray(report.uncertainItems)
    && report.uncertainItems.every((item) => item && typeof item.description === "string"
      && typeof item.reason === "string");
  const allowedIds = new Set(catalogProductIds());
  const validCatalog = mode === ANALYSIS_MODES.areaScanCatalog
    && report && typeof report.summary === "string"
    && Array.isArray(report.identifiedProducts) && report.identifiedProducts.length <= 40
    && report.identifiedProducts.every((item) => item && allowedIds.has(item.productId)
      && typeof item.readAs === "string"
      && Number.isInteger(item.count) && item.count >= 0
      && isStringList(item.visibleEvidence) && confidenceValues.includes(item.confidence))
    && Array.isArray(report.uncertainItems)
    && report.uncertainItems.every((item) => item && typeof item.description === "string"
      && typeof item.reason === "string");
  if (!validTarget && !validArea && !validCatalog) throw new ProviderError("invalid-response");
  return report;
}
