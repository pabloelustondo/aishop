import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = JSON.parse(readFileSync(new URL(
  "../contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/invalid/cases.json",
  import.meta.url)));
const covered = new Set(`authorization-missing
authorization-invalid
request-content-type-unsupported
multipart-malformed
manifest-part-duplicate
artifact-filename-invalid
idempotency-key-missing
idempotency-key-invalid
idempotency-key-mismatch
manifest-hash-missing
manifest-hash-invalid
manifest-hash-mismatch
manifest-extra-owner
manifest-wrong-run-kind
audit-json-invalid
artifact-missing
artifact-unexpected
artifact-duplicate-physical-part
artifact-repeated-logical-reference
artifact-repeated-hash-inconsistent-descriptor
artifact-byte-count-mismatch
artifact-hash-mismatch
jpeg-invalid-with-matching-declaration
jpeg-heic-or-concatenated
configured-limit-exceeded
identical-retry-after-receipt
same-owner-run-conflicting-manifest
concurrent-identical
concurrent-conflicting
storage-failure-after-reservation
database-finalize-failure-then-retry
cross-owner-same-run`.split("\n"));

test("the behavioral suite accounts for every vendored contract case", () => {
  assert.equal(contract.cases.length, 32);
  assert.deepEqual(new Set(contract.cases.map(({ id }) => id)), covered);
});
