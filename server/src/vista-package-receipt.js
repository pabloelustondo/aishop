export function createVistaPackageReceipt(input, receiptId, receivedAt,
  serverEnvironment, ingestVersion) {
  return Object.freeze({ schemaVersion: 1, status: "received", receiptId,
    runId: input.receiptRunId, manifestSha256: input.manifestSha256,
    artifactSha256: Object.freeze([...new Set(input.artifactSha256)].sort()),
    receivedAt, serverEnvironment, ingestVersion,
    analysisStatus: "notRequested" });
}
