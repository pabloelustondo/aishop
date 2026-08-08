import {
  ClientError, ERROR_MESSAGES, InspectionOperationError, ProviderError
} from "./errors.js";
import { EvidenceNotFoundError } from "./evidence-reader.js";
import { sendJson } from "./http-json.js";

export async function readInspectionEvidence(reader, scanId) {
  try {
    return await reader.readOriginal(scanId);
  } catch (error) {
    if (error instanceof EvidenceNotFoundError) throw error;
    throw new InspectionOperationError("evidence", error);
  }
}

export function sendInspectionError(error, response, logger) {
  if (error instanceof ClientError) {
    sendJson(response, error.status, { error: error.message });
  } else if (error instanceof EvidenceNotFoundError) {
    sendJson(response, 404, { error: error.message });
  } else if (error instanceof ProviderError) {
    sendJson(response, 502, { error: ERROR_MESSAGES.analysisFailed });
  } else if (error instanceof InspectionOperationError) {
    const message = error.stage === "evidence"
      ? ERROR_MESSAGES.evidenceFailed : ERROR_MESSAGES.recordFailed;
    sendJson(response, 503, { error: message });
  } else {
    logger.error("Unexpected inspection API failure.");
    sendJson(response, 500, { error: ERROR_MESSAGES.operationFailed });
  }
}
