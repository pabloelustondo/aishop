import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AgentUploadError, readAgentUpload
} from "../src/agent-upload-request.js";

const REAL_JPEG = readFileSync(new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg",
  import.meta.url
));

const BOUNDARY = "----agentboundary";

function multipart(parts) {
  const chunks = [];
  for (const part of parts) {
    const disposition = part.filename === undefined
      ? `form-data; name="${part.name}"`
      : `form-data; name="${part.name}"; filename="${part.filename}"`;
    chunks.push(Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: ${disposition}\r\n`
      + (part.type ? `Content-Type: ${part.type}\r\n` : "") + "\r\n"
    ));
    chunks.push(Buffer.isBuffer(part.body) ? part.body : Buffer.from(part.body));
    chunks.push(Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

const request = (body) => ({
  headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
  rawBody: body
});

const oneFile = (body, type = "image/jpeg", filename = "shelf.jpg") =>
  request(multipart([{ name: "file", filename, type, body }]));

async function codeOf(promise) {
  try { await promise; return null; } catch (error) {
    assert.ok(error instanceof AgentUploadError, `unexpected ${error}`);
    return error.code;
  }
}

test("accepts one real JPEG and reports its bytes, hash and dimensions", async () => {
  const { file, run, context } = await readAgentUpload(oneFile(REAL_JPEG));

  assert.deepEqual(file.bytes, REAL_JPEG);
  assert.equal(file.mediaType, "image/jpeg");
  assert.equal(file.fileName, "shelf.jpg");
  assert.equal(file.sha256, createHash("sha256").update(REAL_JPEG).digest("hex"));
  assert.ok(file.width > 0 && file.height > 0);
  assert.equal(run, false, "a plain upload asks for nothing beyond storage");
  assert.equal(context, null);
});

const withFields = (fields) => request(multipart([
  { name: "file", filename: "shelf.jpg", type: "image/jpeg", body: REAL_JPEG },
  ...Object.entries(fields).map(([name, body]) => ({ name, body }))
]));

test("`run` is true only for the literal string true", async () => {
  assert.equal((await readAgentUpload(withFields({ run: "true" }))).run, true);
  for (const value of ["TRUE", "yes", "1", "on", " true"]) {
    assert.equal((await readAgentUpload(withFields({ run: value }))).run, false, value);
  }
});

test("`context` is trimmed, empty is absent, and the ceiling is the server's own", async () => {
  assert.equal((await readAgentUpload(withFields({ run: "true", context: "  count the blue ones  " }))).context,
    "count the blue ones");
  assert.equal((await readAgentUpload(withFields({ run: "true", context: "   " }))).context, null);
  const atCeiling = "é".repeat(500);
  assert.equal((await readAgentUpload(withFields({ run: "true", context: atCeiling }))).context, atCeiling);
  assert.equal(await codeOf(readAgentUpload(withFields({ run: "true", context: "x".repeat(501) }))),
    "context_invalid");
});

test("a field is not a file: the single-file rule still counts only file parts", async () => {
  const { file } = await readAgentUpload(withFields({ run: "true", context: "a", ignored: "b" }));
  assert.equal(file.fileName, "shelf.jpg");
});

test("rejects a file that only claims to be a JPEG", async () => {
  const notJpeg = Buffer.from("PNG\r\n\n this is not a jpeg at all");
  assert.equal(await codeOf(readAgentUpload(oneFile(notJpeg))), "file_not_jpeg");
});

test("rejects a media type this sprint does not accept", async () => {
  assert.equal(
    await codeOf(readAgentUpload(oneFile(REAL_JPEG, "image/png", "shelf.png"))),
    "media_type_unsupported"
  );
});

test("requires exactly one file part", async () => {
  assert.equal(await codeOf(readAgentUpload(request(multipart([])))), "file_missing");

  const two = request(multipart([
    { name: "file", filename: "a.jpg", type: "image/jpeg", body: REAL_JPEG },
    { name: "file", filename: "b.jpg", type: "image/jpeg", body: REAL_JPEG }
  ]));
  assert.equal(await codeOf(readAgentUpload(two)), "file_count_invalid");
});

test("rejects a file above the approved byte ceiling", async () => {
  const huge = Buffer.concat([REAL_JPEG, Buffer.alloc(6 * 1024 * 1024)]);
  assert.equal(await codeOf(readAgentUpload(oneFile(huge))), "file_too_large");
});

test("rejects a request that is not multipart", async () => {
  const notMultipart = { headers: { "content-type": "application/json" },
    rawBody: Buffer.from("{}") };
  assert.equal(await codeOf(readAgentUpload(notMultipart)), "multipart_invalid");
});

test("rejects a JPEG larger than the approved pixel axis", async () => {
  const oversize = Buffer.from(REAL_JPEG);
  const sof = oversize.indexOf(Buffer.from([0xff, 0xc0]));
  assert.ok(sof > 0, "fixture must contain a baseline frame header");
  oversize.writeUInt16BE(5000, sof + 5); // height
  assert.equal(
    await codeOf(readAgentUpload(oneFile(oversize))), "file_dimensions_invalid"
  );
});
