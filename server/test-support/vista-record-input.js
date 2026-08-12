import { readFileSync } from "node:fs";

const root = new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/",
  import.meta.url
);
export const manifest = JSON.parse(readFileSync(new URL("manifest.json", root)));
export const expectedReceipt = JSON.parse(readFileSync(new URL("receipt.json", root)));
export const recordInput = Object.freeze({
  ownerKey: "a77417321dde97958dd3349a2b98a12d2ddbc8d286b4d293a7d24102a7a33224",
  runId: "2c11d24c-86da-4ae9-9be4-d67308e27389",
  receiptRunId: manifest.runId,
  manifestSha256: expectedReceipt.manifestSha256,
  terminalChainHash: manifest.terminalChainHash,
  sealedManifest: manifest.sealedManifest,
  artifactDescriptors: manifest.artifacts,
  artifactSha256: manifest.artifacts.map(({ sha256 }) => sha256).sort()
});
