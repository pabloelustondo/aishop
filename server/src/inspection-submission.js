import { ANALYSIS_MODES, validateAnalysisMode } from "./analysis-contracts.js";
import { ClientError, ERROR_MESSAGES } from "./errors.js";
import { validateImageInput } from "./image-input.js";

export const MAX_APP_VERSION_LENGTH = 64;

function invalidRequest() {
  throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
}

function validateAppVersion(value) {
  if (typeof value !== "string" || value.trim() !== value ||
      value.length === 0 || value.length > MAX_APP_VERSION_LENGTH) {
    invalidRequest();
  }
  return value;
}

function validateCoordinate(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    invalidRequest();
  }
  return value;
}

function validateTargetPosition(mode, value) {
  if (mode === ANALYSIS_MODES.areaScan) {
    if (value !== null) invalidRequest();
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "x,y") {
    invalidRequest();
  }
  return { x: validateCoordinate(value.x), y: validateCoordinate(value.y) };
}

export function validateInspectionSubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalidRequest();
  const keys = Object.keys(body).sort().join(",");
  if (keys !== "appVersion,imageBase64,mediaType,mode,targetPosition") invalidRequest();
  const image = validateImageInput(body);
  const mode = validateAnalysisMode(body.mode);
  return {
    ...image,
    mode,
    appVersion: validateAppVersion(body.appVersion),
    targetPosition: validateTargetPosition(mode, body.targetPosition)
  };
}
