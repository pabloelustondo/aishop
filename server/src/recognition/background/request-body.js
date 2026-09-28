import { ANALYSIS_CONTRACTS } from "../../analysis-contracts.js";
import { ProviderError } from "../../errors.js";

/** Build the provider payload without I/O; transport remains in the adapter. */
export function buildBackgroundRequestBody({ model, imageBase64, mediaType, mode, images, context }) {
  const contract = ANALYSIS_CONTRACTS[mode];
  if (!contract) throw new ProviderError("invalid-mode");
  const note = typeof context === "string" && context.trim() !== "" ? context.trim() : null;
  const supplied = Array.isArray(images) && images.length > 0
    ? images : [{ imageBase64, mediaType, timestampMs: null }];
  if (supplied.some(image => typeof image?.imageBase64 !== "string"
    || typeof image?.mediaType !== "string")) throw new ProviderError("invalid-mode");
  const visualInputs = supplied.flatMap((image, index) => [
    ...(image.timestampMs === null || image.timestampMs === undefined ? [] : [{
      type: "input_text", text: `Sampled video frame ${index + 1} at ${Number(image.timestampMs)} ms.`
    }]),
    { type: "input_image",
      image_url: `data:${image.mediaType};base64,${image.imageBase64}`, detail: "auto" }
  ]);
  return {
    model, background: true, store: true,
    text: { format: { type: "json_schema", name: contract.schemaName, strict: true, schema: contract.schema } },
    input: [{ role: "user", content: [
      { type: "input_text", text: contract.instruction },
      ...(note ? [{ type: "input_text", text: `Additional instruction from the person requesting this analysis: ${note}` }] : []),
      ...visualInputs
    ] }]
  };
}
