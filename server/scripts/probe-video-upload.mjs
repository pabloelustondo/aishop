#!/usr/bin/env node
/**
 * Reproduces the resumable video upload protocol from Node, outside the
 * browser, against the real bucket — so a rejection can be read in full.
 *
 *   node scripts/probe-video-upload.mjs <video-file> --project <id> \
 *     [--origin https://aishop-99d36.web.app] [--chunk-bytes 8388608]
 *
 * It creates a session exactly the way the server does (same store, same
 * options), then PUTs the first chunk with the same Content-Range the page
 * sends, then queries the session, then sends the remaining chunks, and
 * prints every Storage status with its raw body. The object lands under a
 * throwaway owner key and analysis id and is deleted at the end.
 *
 * If the first chunk succeeds here and fails in the browser, the fault is in
 * the browser path — CORS, headers, or the page. If it fails here too, the
 * body says why and the fault is in the protocol or session creation.
 *
 * Pablo runs this on his own machine with his own Application Default
 * Credentials. It reads one file, writes one temporary object, and deletes it.
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((value) => !value.startsWith("--"));
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const project = option("--project", null);
const origin = option("--origin", "https://aishop-99d36.web.app");
const chunkBytes = Number(option("--chunk-bytes", 8 * 1024 * 1024));

if (!file || !project) {
  process.stderr.write("usage: probe-video-upload.mjs <video-file> --project <id> [--origin url] [--chunk-bytes n]\n");
  process.exit(2);
}

const { initializeApp, applicationDefault } = await import("firebase-admin/app");
const { getStorage } = await import("firebase-admin/storage");
const { createAgentEvidenceStore } = await import("../src/agent-evidence-store.js");

const app = initializeApp({ projectId: project, credential: applicationDefault() });
const bucket = getStorage(app).bucket();
const store = createAgentEvidenceStore({ bucket });

const bytes = readFileSync(file);
const byteLength = statSync(file).size;
const ownerKey = createHash("sha256").update(`probe-${randomBytes(8).toString("hex")}`).digest("hex");
const analysisId = `probe${randomBytes(12).toString("hex")}`;
const mediaType = file.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";

const show = (label, response, body) => {
  const range = response.headers.get("range") ?? response.headers.get("Range") ?? "(none)";
  process.stdout.write(`\n${label}\n  status ${response.status}  Range: ${range}\n`);
  if (body) process.stdout.write(`  body: ${body.slice(0, 600).replace(/\n/g, "\n        ")}\n`);
};

process.stdout.write(`bucket ${bucket.name}\nfile ${file}  ${byteLength} bytes  ${mediaType}\n`
  + `owner ${ownerKey.slice(0, 12)}…  analysis ${analysisId}\norigin ${origin}\nchunk ${chunkBytes}\n`);

const { uri, path } = await store.createVideoUploadSession({
  ownerKey, analysisId, mediaType, byteLength, origin
});
process.stdout.write(`\nsession created\n  path ${path}\n  uri  ${uri.replace(/upload_id=[^&]+/, "upload_id=…")}\n`);

try {
  let offset = 0;
  let step = 0;
  while (offset < byteLength) {
    const end = Math.min(byteLength, offset + chunkBytes);
    const response = await fetch(uri, {
      method: "PUT",
      headers: { "Content-Range": `bytes ${offset}-${end - 1}/${byteLength}` },
      body: bytes.subarray(offset, end)
    });
    const body = await response.text().catch(() => "");
    show(`chunk ${step++}  bytes ${offset}-${end - 1}/${byteLength}`, response, body);
    if (response.status === 200 || response.status === 201) { offset = byteLength; break; }
    if (response.status !== 308) {
      process.stdout.write("\nREJECTED — the body above is the reason nobody has seen yet.\n");
      const probe = await fetch(uri, { method: "PUT",
        headers: { "Content-Range": `bytes */${byteLength}` } });
      show("session status after rejection", probe, await probe.text().catch(() => ""));
      process.exitCode = 1;
      break;
    }
    const match = /bytes=0-(\d+)/.exec(response.headers.get("range") ?? "");
    offset = match ? Number(match[1]) + 1 : end;
  }
  if (offset >= byteLength) {
    const [metadata] = await bucket.file(path).getMetadata();
    process.stdout.write(`\nCOMPLETE — object ${metadata.size} bytes, md5 ${metadata.md5Hash}\n`);
  }
} finally {
  await bucket.file(path).delete({ ignoreNotFound: true }).catch(() => {});
  process.stdout.write("\ntemporary object removed\n");
}
