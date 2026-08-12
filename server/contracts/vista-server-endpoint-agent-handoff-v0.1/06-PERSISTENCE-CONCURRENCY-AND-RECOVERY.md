# Persistence, Concurrency, and Recovery Contract

This is the normative minimum algorithm for idempotency. It uses one HTTP
endpoint; no create/finalize client API is required.

## 1. Stable identities

- Parse the verified Firebase `uid` as identity input but do not concatenate it
  directly into an object path.
- Derive a stable server-safe `ownerKey`, preferably lowercase hexadecimal
  SHA-256 of the UTF-8 UID. Keep the original UID only in protected metadata if
  the existing repository's ownership pattern requires it.
- Parse the header and manifest run IDs as UUIDs, compare their normalized
  lowercase canonical strings, and persist that canonical form.
- The package key is `(ownerKey, normalizedRunId)`.
- The reservation's `receiptId` is generated once and never replaced.

## 2. Validate before reserving

After authentication, completely bounded-read and validate the request before
creating durable package state:

1. validate multipart shape and required headers;
2. hash and validate the exact manifest bytes;
3. validate manifest schema and application-level rules;
4. hash, count, sniff, and decode every unique artifact part; and
5. prove equality between declared and uploaded unique artifact-hash sets.

Use bounded temporary files/streams according to the existing server runtime.
Validation failure creates no reservation or final object.

## 3. Reserve package identity transactionally

In one database transaction, read or create a package record:

```text
ownerKey
runId
manifestSha256
receiptId
status = receiving | received
createdAt
receivedAt = null until final transition
artifactDescriptors
```

Decision:

- absent: create `receiving` with the submitted manifest hash and a new receipt
  ID;
- same hash and `receiving`: resume the same reservation;
- same hash and `received`: return its immutable receipt with `200`;
- different hash in either state: return `409 run_manifest_conflict` without
  mutation.

This transaction is the authority for conflict resolution. An object found in
Storage without a matching reservation is not by itself a received package.

## 4. Create immutable evidence objects

Write the exact manifest and artifact bytes to private server-owned paths using
create-only preconditions. Suggested shape:

```text
vista/inspection-packages/{ownerKey}/{runId}/manifest/{manifestSha256}.json
vista/inspection-packages/{ownerKey}/{runId}/artifacts/{artifactSha256}
```

The strict artifact filename is only an untrusted claimed hash used to bind the
part to a descriptor. Validate it, recompute the body hash, then use the
verified computed hash shown above. Never concatenate the raw filename or a
device `relativeLocation` into a path. Store verified content type, SHA-256,
byte count, owner key, run ID, and manifest hash as protected object metadata
where the platform supports it.

When create-only reports that an object already exists, count it as success
only after verifying its stored length, hash, content type, and package
ownership metadata. A conflict or unverifiable object is an integrity failure,
not permission to overwrite.

## 5. Finalize once

After every declared object is verified durable, use a second database
transaction:

- require the same owner/run reservation, manifest hash, and `receiving`
  state;
- atomically change it to `received`;
- set one server timestamp as `receivedAt`; and
- persist the immutable receipt fields and canonical sorted artifact-hash set.

The request that performs this transition returns `201`. A concurrent or later
identical request that observes the existing `received` record returns `200`
with the same receipt ID, timestamp, and body. No response may change
`analysisStatus` in endpoint v1; it is always `notRequested`.

## 6. Failure and crash truth

- Failure before reservation: no package state and no final object.
- Failure after reservation but before all objects: state remains `receiving`;
  no receipt is returned.
- Failure after all objects but before final transaction: state remains
  `receiving`; no receipt is returned.
- A same-manifest retry resumes, verifies any existing objects, creates the
  missing objects, and attempts finalization.
- A conflicting-manifest retry is rejected even while the first reservation is
  incomplete.
- Storage or database unavailability returns
  `503 evidence_persistence_unavailable` with `retryable=true`.
- The server must emit a bounded diagnostic for stale `receiving` reservations.
  Automated cleanup/retention is outside v1 and may not delete evidence without
  an approved policy.

Two concurrent identical requests therefore converge on one receipt. Two
concurrent conflicting requests result in one reservation and one conflict.
This is deliberate recoverability, not cross-system atomicity.
