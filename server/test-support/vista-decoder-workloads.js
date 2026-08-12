import { randomFillSync } from "node:crypto";
import { join } from "node:path";
import sharp from "sharp";

const image = { width: 4096, height: 4096, channels: 3 };

export async function createVistaDecoderWorkloads(directory) {
  const dense = join(directory, "dense.jpg");
  const compact = join(directory, "compact.jpg");
  await sharp({ create: { ...image,
    background: { r: 41, g: 97, b: 173 } } }).jpeg().toFile(compact);
  const noise = randomFillSync(Buffer.alloc(image.width * image.height * image.channels));
  await sharp(noise, { raw: image }).jpeg({ quality: 30 }).toFile(dense);
  return { compact, dense };
}
