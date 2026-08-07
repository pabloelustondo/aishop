import { ClientError, ERROR_MESSAGES } from "./errors.js";
import { isStructurallyValidJpeg } from "./jpeg-structure.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function failInvalidImage() {
  throw new ClientError(400, ERROR_MESSAGES.invalidImage);
}

export function validateImageInput(body, maxImageBytes = MAX_IMAGE_BYTES) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    failInvalidImage();
  }

  const { imageBase64, mediaType } = body;
  if (mediaType !== "image/jpeg" || typeof imageBase64 !== "string") {
    failInvalidImage();
  }

  if (
    imageBase64.length < 4 ||
    imageBase64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)
  ) {
    failInvalidImage();
  }

  const padding = imageBase64.endsWith("==") ? 2 : imageBase64.endsWith("=") ? 1 : 0;
  const estimatedBytes = (imageBase64.length * 3) / 4 - padding;
  if (estimatedBytes > maxImageBytes) {
    throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
  }

  const bytes = Buffer.from(imageBase64, "base64");
  if (
    bytes.length === 0 ||
    bytes.toString("base64") !== imageBase64 ||
    !isStructurallyValidJpeg(bytes)
  ) {
    failInvalidImage();
  }

  return { imageBase64, mediaType };
}
