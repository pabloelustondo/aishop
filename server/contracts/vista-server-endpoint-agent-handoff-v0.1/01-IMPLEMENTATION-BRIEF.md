# VISTA Inspection-Package Endpoint — Server Implementation Brief

**Mode:** server implementation after local preflight and contract review  
**Scope:** one endpoint, one development environment, test-first  
**Owner and final decision authority:** Pablo Elustondo

## 1. Required outcome

Add a VISTA-specific endpoint beside the existing AI-Shop endpoint:

```http
POST /v1/vista/inspection-packages
```

For one authenticated user and one client-declared VISTA run transport package,
it must:

1. authenticate with a Firebase bearer token;
2. derive ownership from the verified Firebase `uid`;
3. strictly validate the manifest and multipart artifact set;
4. verify exact bytes, SHA-256, byte count, audit JSON syntax, and JPEG
   structure/decode limits;
5. store manifest and artifacts privately without overwrite;
6. create one durable package/receipt record;
7. return `201` for first receipt and `200` with the same logical receipt for an
   identical retry; and
8. return `409` when the same owner/run ID is submitted with a different
   manifest hash.

Success means evidence receipt only. It does not mean server AI analysis or
human confirmation. It also does not attest genuine device origin or prove
that a hostile client declared every artifact in its local C07 run.

## 2. Preserve the existing AI-Shop path

Do not modify the semantics of:

```http
POST /inspections
```

AI-Shop may continue to accept one Base64 JPEG and synchronously produce its
existing report. VISTA uses a separate route because it sends a completed
multi-artifact run with different identity, completeness, and receipt
semantics.

## 3. Proposed server participants

Adapt names to the existing codebase vocabulary, but preserve these
responsibilities. Do not collapse them into a broad generic service.

### VISTA Package HTTP Route

- Owns HTTP method/path, bearer extraction, multipart boundary, response
  mapping, and request cancellation.
- Delegates authentication to the existing Firebase verifier.
- Does not decide package integrity, storage naming, or idempotency truth.

### VISTA Package Contract Validator

- Owns strict manifest schema and multipart-set validation.
- Verifies manifest hash, artifact set, declared types, byte counts, SHA-256,
  and JPEG structure.
- Treats the strict hash filename only as an untrusted claimed descriptor
  identity, then verifies it against computed bytes; raw filenames never become
  Storage paths.
- Returns typed stable failure codes.
- Does not perform authentication or Firestore/Storage writes.

### VISTA Evidence Store

- Owns private immutable object creation under the trusted owner/run namespace.
- Uses non-overwriting semantics equivalent to AI-Shop's
  `ifGenerationMatch: 0` behavior.
- Does not decide whether a package is complete or authenticated.

### VISTA Package Repository

- Owns the durable package identity, lifecycle, manifest hash, trusted owner,
  artifact descriptors, and receipt.
- Implements the same-run/same-manifest idempotency decision and
  same-run/different-manifest conflict.
- Uses create/transaction semantics; no silent overwrite.
- Does not store raw image bytes in Firestore.

### VISTA Package Ingest Coordinator

- Orders validation, evidence persistence, durable package/receipt creation,
  and response production.
- Never emits a receipt before the full declared set is verified and durable.
- Makes partial-failure state/reconciliation explicit.
- Does not call OpenAI in this increment.

Follow the reservation, create-only object, finalization, and recovery
algorithm in `06-PERSISTENCE-CONCURRENCY-AND-RECOVERY.md`; do not substitute an
unspecified best-effort write sequence.

## 4. Required data ownership

- Firebase Authentication owns identity proof.
- Verified `uid` is the only source used to derive server `ownerKey`.
- Normalized VISTA `runId` is the idempotency identity within one trusted
  server-safe owner key.
- VISTA manifest owns the expected logical artifact references.
- Cloud Storage owns evidence bytes.
- Firestore or the existing server database owns package/receipt lifecycle
  metadata.
- The server receipt proves receipt. It does not redefine the local result.

## 5. Required persistence shape

Suggested private Storage namespace:

```text
vista/inspection-packages/{ownerKey}/{runId}/manifest/{manifestSha256}.json
vista/inspection-packages/{ownerKey}/{runId}/artifacts/{sha256}
```

Suggested package record fields:

```text
schemaVersion
runId
ownerKey
manifestSha256
terminalChainHash
sealedManifest
artifactDescriptors[]
status = receiving | received
receiptId
createdAt
receivedAt
ingestVersion
analysisStatus = notRequested
```

Use existing server timestamp and immutable-create conventions. Do not use a
client timestamp as server receipt time.

## 6. Failure and retry semantics

- Validation/integrity failures are non-retryable without changing client
  input.
- Authentication failure is `401` and contains no token detail.
- Missing/invalid/mismatched idempotency and manifest-hash headers use their
  stable contract codes; they are not collapsed into an artifact error.
- Configured-size failure is `413`.
- Existing run with conflicting manifest is `409`.
- Storage/database temporary failure is `503` and retryable.
- Unexpected errors are safe `500` responses with server diagnostics that do
  not expose secrets or evidence.
- An identical retry after successful receipt returns the existing logical
  receipt and performs no overwrite or duplicate analysis.

If a request persists some objects but fails before receipt creation, it must
not report success. Implement or document a safe staging/reconciliation truth.
Do not claim filesystem/database atomicity that the platform does not provide.

## 7. TDD order

Write and run these failing tests before the corresponding implementation:

1. missing and invalid token;
2. missing/invalid/mismatched idempotency key;
3. missing/invalid/mismatched manifest-hash header;
4. malformed multipart and duplicate manifest part;
5. malformed/extra manifest field;
6. missing audit artifact;
7. missing declared image;
8. undeclared or duplicate physical artifact;
9. wrong artifact SHA-256;
10. wrong artifact byte count;
11. invalid audit JSON;
12. false JPEG media claim or dimension/decode limit;
13. first successful package returns exact receipt;
14. identical and concurrently identical retries converge on one receipt;
15. same run/different manifest, including concurrent conflict, returns
    conflict;
16. one owner cannot collide with or access another owner's package;
17. Storage failure produces no receipt;
18. database-finalization failure resumes without a false receipt;
19. no secret/token/raw-evidence content appears in emitted logs.

Then run the complete existing AI-Shop server suite to prove the original
endpoint did not regress.

## 8. Explicit non-goals

- Do not add OpenAI/model execution.
- Do not add GET/status routes.
- Do not add reviewer authorization or evidence download.
- Do not add signed receipts.
- Do not add resumable per-file/signed-URL flows.
- Do not add deletion, retention, or cleanup policy beyond safe failed-attempt
  staging/reconciliation.
- Do not deploy unless Pablo separately authorizes deployment and names the
  target project.
- Do not add new packages unless the existing codebase cannot satisfy a
  concrete need and approval is obtained.

## 9. Stop conditions

Stop and request direction when:

- the deployed platform cannot safely accept the approved multipart package
  below its actual request limit;
- existing middleware consumes or mutates multipart bytes in a way that breaks
  exact hashing;
- current Firebase project/Storage/Firestore ownership is unclear;
- required evidence must cross a region or retention boundary not yet approved;
- implementation requires changing the existing AI-Shop contract;
- package receipt cannot be made idempotent with current persistence; or
- a requested exception would weaken authentication, completeness, integrity,
  immutability, or ownership isolation.

## 10. Definition of done for the server endpoint

- Shared valid and invalid fixtures drive tests.
- All focused server tests pass.
- Existing AI-Shop regression tests pass.
- A development integration test uploads one audit file and at least one real
  JPEG and verifies stored SHA-256/length.
- Identical retry returns the same receipt.
- Manifest conflict is rejected without mutation.
- Cross-owner access/collision is rejected.
- Evidence is private and non-overwriting.
- Logs are free of tokens, Base64, raw bytes, credentials, and provider secrets.
- Every success and error response is JSON with `Cache-Control: no-store`.
- Exact commands, environment, revision, results, limitations, and review are
  recorded.
- Human acceptance remains pending until Pablo reviews the evidence.
