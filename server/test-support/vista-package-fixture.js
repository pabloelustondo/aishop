import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const root = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/",
  import.meta.url
);
export const fixture = Object.freeze({
  manifest: readFileSync(new URL("manifest.json", root)),
  audit: readFileSync(new URL("audit-transport.json", root)),
  jpeg: readFileSync(new URL("accepted-detail.jpg", root))
});
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function validParts() {
  return [
    { name: "manifest", filename: "manifest.json", type: "application/json",
      bytes: fixture.manifest },
    { name: "artifact", filename: `${hash(fixture.audit)}.json`,
      type: "application/json", bytes: fixture.audit },
    { name: "artifact", filename: `${hash(fixture.jpeg)}.jpg`,
      type: "image/jpeg", bytes: fixture.jpeg }
  ];
}

export function multipart(parts, boundary = "vista-test-boundary") {
  const chunks = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; ` +
      `name="${part.name}"; filename="${part.filename}"\r\n` +
      `Content-Type: ${part.type}\r\n\r\n`));
    chunks.push(part.bytes, Buffer.from("\r\n"));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}

export function request(parts = validParts(), headerChanges = {}) {
  const { boundary, body } = multipart(parts);
  return { method: "POST", url: "/v1/vista/inspection-packages", rawBody: body,
    headers: { "content-type": `multipart/form-data; boundary=${boundary}`,
      "idempotency-key": "2C11D24C-86DA-4AE9-9BE4-D67308E27389",
      "x-vista-manifest-sha256": hash(fixture.manifest), ...headerChanges } };
}
