import { readFileSync } from "node:fs";
import { decodeVistaJpeg } from "../src/vista-jpeg-decoder.js";
import { readVistaPackageLimits } from "../src/vista-package-limits.js";
import { createFirebaseVistaPackageHandler } from
  "../src/firebase-vista-package-handler.js";

await import("../src/firebase.js");

const bytes = readFileSync(process.argv[2]);
const iterations = Number(process.argv[3]);
const limits = readVistaPackageLimits(process.env);
const handler = createFirebaseVistaPackageHandler({ limits,
  logger: { error() {}, warn() {} } });
const retainedPackage = Buffer.alloc(limits.packageBytes - bytes.length, 1);
let maximumRss = process.memoryUsage().rss;
const started = performance.now();

for (let count = 0; count < iterations; count += 1) {
  await decodeVistaJpeg(bytes, limits);
  maximumRss = Math.max(maximumRss, process.memoryUsage().rss);
}

console.log(JSON.stringify({ maximumRss, decoderInputBytes: bytes.length,
  decoded: iterations, elapsedMs: performance.now() - started,
  retainedBytes: retainedPackage.length + bytes.length,
  handlerReady: typeof handler === "function" }));
