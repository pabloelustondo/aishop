# VISTA Server Invariants for Package Ingestion

These constraints are required even though the receiving agent works in the
server repository rather than the iPhone repository.

## Inspection and evidence meaning

- One `runId` identifies one completed Inspector Inspection run.
- KAM Onboarding and Inspector Inspection are separate journeys. The server
  must not merge their identities or infer that one run contains both.
- Store identity is explicit. GPS may be evidence but is never sole identity.
- The client is required to declare the audit export and every accepted image
  selected for transport. Endpoint v1 proves the complete declared set, not
  that a hostile client disclosed every local C07 artifact.
- The server does not invent missing images, events, identifiers, versions,
  results, counts, confidence, or success.

## Offline-first behavior

- The inspection and local result exist before upload.
- Server unavailability cannot retroactively make the local run incomplete.
- A server receipt is additive evidence that a particular package was received.
- Server analysis or review, when added later, is a separate assessment.

## Local-versus-server truth

- `received` means all artifacts declared in the submitted transport manifest
  were durably stored and byte/hash/type verified.
- It does not mean recognition succeeded, the local result was confirmed, or a
  human accepted the inspection.
- A future server result must preserve the original local result and provenance.
- Server disagreement must be represented explicitly; never overwrite history.

## Integrity

- Receipt must bind trusted owner, normalized run ID, exact manifest SHA-256,
  and complete unique declared transport artifact-hash set.
- Missing, unexpected, truncated, corrupt, or wrong-hash evidence prevents
  receipt.
- Existing evidence is immutable. A retry cannot replace it.
- Same run/same manifest is idempotent; same run/different manifest is conflict.
- Partial persistence is not success and requires truthful reconciliation.

## Audit and logs

- The uploaded audit JSON is preserved as the client's claimed authoritative
  structured VISTA evidence. Endpoint v1 validates syntax and bytes but does
  not attest its C07 semantics or device origin.
- Server operational logs are diagnostics, not a substitute for the audit.
- Never log passwords, Firebase ID tokens, Authorization headers, image bytes,
  image Base64, audit bodies, OpenAI keys, Firebase credentials, or raw private
  Storage URLs.
- Log stable operation/failure codes, receipt/run correlation, byte counts,
  hashes where approved, and timing—not content.

## Privacy and access

- Ownership comes only from verified Firebase `uid`.
- Firebase authentication proves control of an account token; it does not prove
  that the request came from an untampered VISTA app or genuine device.
- Client body never asserts `ownerId`.
- Evidence remains private and uses no-store semantics when later retrieved.
- Reviewer access is outside this endpoint and must not be accidentally granted
  by package submission.
- No automatic deletion or purge eligibility is implied by receipt in this
  increment.
- Exact image bytes can retain EXIF. Do not re-encode, strip, expose, or move
  them across an unapproved residency/retention boundary.

## Capability honesty

- Do not call package ingestion server analysis.
- Do not call an HTTP `2xx` a receipt unless the exact response contract and
  integrity validation succeeded.
- Do not label mocked, fixture, emulator, or local-test-server evidence as a
  deployed Firebase integration.
- Do not call the receipt device attestation, chain verification, recognition
  confirmation, or proof that the client declared all local evidence.
- Compilation and unit tests do not replace a development Storage/Firestore
  integration check when deployment is authorized.
