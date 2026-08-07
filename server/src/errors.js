export const ERROR_MESSAGES = Object.freeze({
  invalidImage: "A valid JPEG image is required.",
  imageTooLarge: "The image is too large. Please take another picture.",
  invalidRequest: "The request could not be read. Please try again.",
  unauthorized: "Unauthorized.",
  analysisFailed: "The product could not be analyzed. Please try again.",
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
