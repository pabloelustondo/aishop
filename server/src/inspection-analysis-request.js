import { ANALYSIS_CONTRACTS, ANALYSIS_MODES } from "./analysis-contracts.js";

export function analysisInstruction(mode, targetPosition) {
  const base = ANALYSIS_CONTRACTS[mode]?.instruction;
  if (mode !== ANALYSIS_MODES.targetProduct) return base;
  const x = targetPosition.x.toFixed(4);
  const y = targetPosition.y.toFixed(4);
  return [
    `Analyze only the product at normalized image position x=${x}, y=${y}.`,
    "Coordinates run left-to-right and top-to-bottom from 0 to 1.",
    "The indicated product is always primary; never substitute a more prominent surrounding product.",
    "Use surrounding objects only as context and report uncertainty if the indicated product is unclear.",
    base
  ].join(" ");
}

export function buildInspectionAnalysisRequest(submission, model) {
  const contract = ANALYSIS_CONTRACTS[submission.mode];
  return {
    model,
    store: false,
    // Raised with the 40-product ceiling. A full shelf answer is roughly
    // 45 tokens per product plus the summary and uncertain items, so 1,200
    // truncated mid-JSON well before 40 products — and a truncated response
    // fails strict schema validation, surfacing as a 502 rather than as a
    // partial answer. 6,000 clears the worst case with margin.
    max_output_tokens: 6_000,
    text: { format: {
      type: "json_schema",
      name: contract.schemaName,
      strict: true,
      schema: contract.schema
    } },
    input: [{ role: "user", content: [
      {
        type: "input_text",
        text: analysisInstruction(submission.mode, submission.targetPosition)
      },
      {
        type: "input_image",
        image_url: `data:${submission.mediaType};base64,${submission.imageBase64}`,
        detail: "auto"
      }
    ] }]
  };
}
