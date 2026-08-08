export const ERROR_MESSAGES = Object.freeze({
  invalidImage: "A valid JPEG image is required.",
  imageTooLarge: "The image is too large. Please take another picture.",
  invalidRequest: "The request could not be read. Please try again.",
  unauthorized: "Unauthorized.",
  analysisFailed: "The product could not be analyzed. Please try again.",
  evidenceFailed: "The image could not be stored. Please try again.",
  recordFailed: "The inspection could not be saved. Please try again.",
  reviewFailed: "The review operation failed. Please try again.",
  operationFailed: "The inspection operation failed. Please try again.",
  notFound: "The requested endpoint does not exist."
});

export class ClientError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ClientError";
    this.status = status;
  }
}

export class ProviderError extends Error {
  constructor(kind) {
    super("OpenAI request failed.");
    this.name = "ProviderError";
    this.kind = kind;
  }
}

export class InspectionOperationError extends Error {
  constructor(stage, cause) {
    super(`Inspection ${stage} operation failed.`, { cause });
    this.name = "InspectionOperationError";
    this.stage = stage;
  }
}
