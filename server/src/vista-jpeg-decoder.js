import sharp from "sharp";
import { inspectVistaJpeg } from "./vista-jpeg.js";
import { vistaError } from "./vista-package-error.js";

sharp.cache(false);
sharp.concurrency(1);

function structuralDimensions(bytes, limits) {
  const dimensions = inspectVistaJpeg(bytes);
  if (!dimensions || dimensions.width > limits.jpegAxis ||
      dimensions.height > limits.jpegAxis ||
      dimensions.width * dimensions.height > limits.jpegPixels) {
    throw vistaError("invalid_jpeg");
  }
  return dimensions;
}

export async function decodeVistaJpeg(bytes, limits) {
  const dimensions = structuralDimensions(bytes, limits);
  const options = { failOn: "warning", limitInputPixels: limits.jpegPixels,
    sequentialRead: true };
  try {
    const metadata = await sharp(bytes, options).metadata();
    const statistics = await sharp(bytes, options).raw().stats();
    const sameDimensions = metadata.width === dimensions.width &&
      metadata.height === dimensions.height;
    if (metadata.format !== "jpeg" || !sameDimensions ||
        statistics.channels.length !== metadata.channels) {
      throw new Error("decode mismatch");
    }
    return dimensions;
  } catch (error) {
    throw vistaError("invalid_jpeg", error);
  }
}
