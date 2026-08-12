# Sprint 005 — VISTA Inspection Package Ingest Endpoint

HumanReviewerInitials:PME

## Goal

Add one authenticated server endpoint, `POST /v1/vista/inspection-packages`, that receives one complete client-declared VISTA transport package as multipart data — one manifest JSON part, one VISTA audit JSON artifact, and every declared JPEG artifact — validates the complete declared set, stores it privately and immutably, and returns an idempotent receipt bound to the normalized VISTA run ID, manifest SHA-256, and accepted artifact-hash set. The receipt proves the complete declared set was received; it does not prove the device disclosed every local artifact.

## Governing requirements

The normative contract is the vendored, externally governed, read-only handoff bundle at `server/contracts/vista-server-endpoint-agent-handoff-v0.1/`, byte-identical to its `SHA256SUMS.txt` (verification passed 2026-08-10) and exempt from the 50-line rule as third-party content. Contract changes happen upstream in VISTA and arrive as a new bundle version; record the VISTA source commit once the bundle is committed upstream (currently untracked there). Authentication, immutable storage, JPEG validation, and error shaping reuse the patterns approved in Sprint 004 and the existing inspection API.

## In scope

- Multipart parsing via a directly declared parser dependency (e.g. Busboy over the function's raw body) with strict part-name and part-count rules.
- Firebase ID-token verification reusing the Sprint 004 customer-identity check. Ownership derives only from the verified `uid`, converted to a hashed `ownerKey` (lowercase hex SHA-256 of the UTF-8 UID) for every object and document key; the raw UID never appears in a storage path.
- Strict manifest v1 validation against the bundle's schema. Tests consume the vendored schemas and fixtures in place — no hand-maintained second copy.
- Per-artifact SHA-256, byte-count, and JPEG structural verification; exact equality between declared and uploaded unique hash sets; final objects named only by verified computed hashes, never by client filenames.
- Immutable, private storage under `vista/inspection-packages/{ownerKey}/{normalizedRunId}/` with non-overwriting semantics.
- Transactional `receiving → received` reservation and finalization per the bundle's persistence contract: same owner/run and manifest returns the same immutable receipt (`200`); first success returns `201`; a different manifest returns `409`; no receipt exists without complete durable storage.
- The stable error-code contract from the bundle schemas; `Cache-Control: no-store` on every response.
- Fail-closed explicit limits covering manifest bytes, audit bytes, bytes per JPEG, decoded pixel dimensions, image count, unique and total multipart part counts, and complete package bytes. Byte candidates from measured field evidence: 5 MiB per artifact and 25 MiB per package (largest observed package 5.6 MB; platform ceiling 32 MB). Part-count, dimension, and exact multipart-parser package/version values must be specified in the Sprint Plan Tasks and human-approved before coding, and stay below the manifest's 100-descriptor protocol ceiling. Missing limit configuration prevents startup.
- Automated tests written RED first: unauthorized, malformed, missing, unexpected, corrupt, oversized, duplicate-part, conflict, concurrent-retry, crash-recovery, storage-failure, finalization-failure, cross-owner, and logging-redaction cases plus the happy path, validated with the vendored fixtures and the Firebase emulator.

## Security boundaries

- No owner ID, reviewer status, or ownership claim is ever accepted from the request body; the raw UID is kept only in protected metadata where the existing ownership pattern requires it.
- Evidence objects are never public; responses never expose storage paths, tokens, or internal errors; the Authorization header is never logged.
- Stored evidence and receipts are never overwritten or mutated after creation.

## Delivery order

1. Wire a failing contract test that consumes the vendored schemas and fixtures in place.
2. Implement authentication with `ownerKey` derivation, multipart parsing, and manifest validation.
3. Implement artifact verification, immutable storage, transactional reservation and finalization, and the receipt.
4. Complete the negative-path, concurrency, and recovery test matrix and emulator end-to-end validation.

## Acceptance and evidence

- All fixture-driven positive and negative contract tests pass from a clean checkout, with recorded commands and results.
- A repeated identical upload returns one logical receipt, including under concurrent retry; a conflicting manifest returns `409`; an overwrite attempt fails; a simulated crash between reservation and finalization recovers without a false receipt.
- The existing `/inspections` endpoint behavior is unchanged, proven by its existing suite.

## Out of scope

VISTA iPhone implementation, server AI analysis of VISTA packages, assessment or receipt retrieval endpoints, resumable or background uploads, reviewer UI, retention or deletion automation, changes to the existing `/inspections` endpoint, and production deployment remain outside Sprint 005.
