# VISTA Minimal Server Upload Endpoint Specification

**Version:** 0.2  
**Status:** PROPOSED — implementation contract for Pablo/server-agent review  
**Date:** 2026-08-10  
**Purpose:** smallest credible server change for receiving one VISTA inspection
transport package without adding a multi-endpoint upload framework

AI-Shop context is in the VISTA repository at
`docs/04_architecture_and_planning/reference/aishop-ios-server-integration-guide/`.
The portable handoff copy is at
`reference/aishop-ios-server-integration-guide/`.

## 1. Decision summary

The existing AI-Shop `POST /inspections` endpoint remains sufficient for a
one-image connectivity/analysis spike. It is not sufficient when VISTA needs
one server receipt for a run containing an audit export and multiple images.

That larger requirement needs exactly one new client-facing endpoint:

```http
POST /v1/vista/inspection-packages
```

No create, finalize, status, analysis, or review endpoint is mandatory for the
first upload increment.

## 2. What a package means

A package is a logical transport set, not a ZIP file. Version 1 contains:

1. one strict manifest JSON part;
2. one VISTA audit-export JSON artifact; and
3. at least one JPEG artifact declared by the manifest.

The client is required to include every accepted inspection image selected by
the completed-run package builder. The server verifies the complete set
declared by the manifest. It does **not** prove that a buggy or hostile client
declared every image or every artifact present in its local C07 history.

## 3. Why the current one-image endpoint cannot provide this receipt

The documented AI-Shop endpoint:

- accepts exactly one Base64 JPEG;
- rejects extra request fields;
- creates a separate server scan ID for each request;
- has no VISTA run ID or audit-export input;
- returns success only after synchronous AI analysis; and
- cannot acknowledge one exact multi-image set as one inspection.

Calling it once per image creates unrelated scans. The phone cannot distinguish
“all declared images received” from “some calls succeeded.” The new endpoint is
mandatory only for the multi-artifact receipt semantics above; it is not
mandatory for a one-image spike.

## 4. HTTP contract

```http
POST /v1/vista/inspection-packages
Authorization: Bearer <firebase-id-token>
Idempotency-Key: <vista-run-uuid>
X-Vista-Manifest-SHA256: <64 lowercase hex>
Content-Type: multipart/form-data; boundary=<boundary>
```

All success and error responses are:

```http
Content-Type: application/json
Cache-Control: no-store
```

### 4.1 Authentication and threat boundary

1. Require and verify a Firebase bearer ID token using the existing server
   authentication boundary.
2. Derive ownership only from the verified `uid`.
3. Convert the UID to a stable server-safe owner key, preferably lowercase hex
   SHA-256 of the UTF-8 UID, before using it in an object/document key.
4. Never accept an owner ID, email, reviewer role, or ownership path from the
   request.
5. Never log the token or Authorization header.

Firebase authentication proves control of an account token. Artifact hashes
prove byte equality. Neither proves genuine VISTA app/device origin, an
untampered device, or complete disclosure of local evidence. App Check,
attestation, and signed evidence are explicit non-goals for v1.

### 4.2 Multipart fields

| Field | Count | Required content type | Meaning |
|---|---:|---|---|
| `manifest` | exactly 1 | `application/json` | exact UTF-8 manifest bytes |
| `artifact` | exactly 1 per unique declared SHA-256 | descriptor type | audit or JPEG bytes |

No other multipart field name is allowed.

The manifest filename is exactly `manifest.json`. Every artifact filename is a
mandatory but untrusted descriptor claim:

- audit: `<declared-sha256>.json`;
- JPEG: `<declared-sha256>.jpg`.

Reject a missing filename, any path separator, or any non-lowercase/non-hash
basename as `artifact_identity_invalid`. Use the claimed hash only to select
the expected manifest descriptor. Compute SHA-256 over the received bytes and
compare it with that claim. Never concatenate the raw filename into a Storage
path; only the verified computed hash may name the final object.

When several logical descriptors reference identical bytes, upload one physical
part for that unique hash. Repeating the physical body is
`artifact_duplicate`.

## 5. Manifest v1

The normative schema is `schemas/manifest-v1.schema.json`. The golden body is
`fixtures/valid/manifest.json`. Do not hand-maintain a second divergent schema
from the abbreviated structure below:

```json
{
  "schemaVersion": 1,
  "runId": "<UUID>",
  "runKind": "inspection",
  "completedAt": "<UTC ISO-8601 ending in Z>",
  "versions": {
    "app": "<value>",
    "osVersion": "<value>",
    "device": "<value>",
    "model": "<value>",
    "catalog": "<value>",
    "policy": "<value>",
    "profileVersion": 1,
    "scenario": null
  },
  "context": {
    "visitId": null,
    "storeId": "<explicit value or null when absent from the run>",
    "assignmentId": null,
    "targetAreaId": null
  },
  "terminalChainHash": "<64 lowercase hex>",
  "sealedManifest": "<64 lowercase hex C07 digest>",
  "artifacts": [
    {
      "id": "audit-events",
      "kind": "audit/events",
      "mediaType": "application/json",
      "sha256": "<64 lowercase hex>",
      "byteCount": 12345,
      "captureId": null
    },
    {
      "id": "<C07 artifact ID>",
      "kind": "image/detailStill",
      "mediaType": "image/jpeg",
      "sha256": "<64 lowercase hex>",
      "byteCount": 234567,
      "captureId": "<capture.saved captureID>"
    }
  ]
}
```

### 5.1 Schema and application rules

- Unknown object fields are rejected.
- `schemaVersion` is exactly `1`; `runKind` is exactly `inspection`.
- Parse both run-ID values as UUIDs and compare normalized lowercase canonical
  strings. Case differences alone are not a conflict.
- `completedAt` is a valid date-time ending in UTC `Z`; offsets are refused in
  v1 even if a generic date-time parser accepts them.
- `terminalChainHash` and `sealedManifest` are 64 lowercase hex digests.
- `sealedManifest` is
  `SHA256("manifest:" + finalChainHead + ":" +
  sort(unique(C07-referenced-artifact-hashes)).join(","))`. The audit-export
  file hash is not in that preimage.
- The handler stores the two C07 digests but v1 does not claim to verify their
  semantic relationship to an arbitrary submitted audit.
- Exactly one logical `audit/events` descriptor and at least one image
  descriptor are required.
- Logical artifact IDs are unique.
- Repeated descriptors may share one SHA only when their media type and byte
  count agree.
- Each physical artifact part is bound by the mandatory strict hash filename;
  its extension and part content type agree with the selected descriptor.
- The unique uploaded hash set equals the unique declared hash set exactly.
- `artifacts.maxItems = 100` is a protocol ceiling, not a promise that the
  target runtime accepts 100 images. Configured runtime limits may be lower.
- Context identifiers are never inferred from GPS. `null` means the completed
  run did not supply that identifier.
- No absolute device path, Firebase token, credential, raw Base64, owner ID, or
  client-chosen server path appears in the manifest.

## 6. Audit and image validation

### 6.1 Audit artifact

The audit part must match its declared length and SHA-256 and be syntactically
valid JSON with a top-level array. Preserve the exact bytes. Endpoint v1 is not
an audit-chain attestation service; see
`05-C07-EXPORT-AND-IMAGE-CONTRACT.md` for the exact C07 algorithm and claim
boundary.

### 6.2 JPEG artifacts

Each image part must:

- match its declared length and SHA-256;
- contain exactly one structurally decodable JPEG;
- satisfy configured dimensions, megapixels, and decoded-resource limits; and
- retain its exact bytes. The server must not re-encode or strip EXIF under the
  submitted hash.

Current VISTA runs record stills through a legacy `application/octet-stream`
default even when their bytes are JPEG. A package may declare transport type
`image/jpeg` only after those exact bytes are positively identified/decoded as
one JPEG. HEIC/HEIF/unknown bytes are not relabeled. See
`05-C07-EXPORT-AND-IMAGE-CONTRACT.md`.

## 7. Required handler order and error precedence

Configured request limits are enforced while reading. If the platform rejects
the body before the handler executes, record the platform behavior separately.
Once the handler has control, process in this order:

1. authentication;
2. outer request media type and multipart framing;
3. required-header presence and lexical validity;
4. exactly one manifest part and expected field names;
5. manifest byte limit and exact manifest-header hash;
6. strict manifest JSON/schema/application validation;
7. normalized idempotency-key equality;
8. artifact filename identity, duplicate claimed hash, missing declared hash,
   then unexpected claimed hash checks;
9. artifacts in lexical SHA order: byte count, hash, audit syntax or JPEG
   decode/type limits;
10. transactional reservation, immutable object persistence, and finalization.

If one part has several faults, byte-count mismatch wins over hash mismatch;
hash mismatch wins over audit/JPEG-content validation. No validation failure
creates durable package state.

## 8. Stable error contract

All errors conform to `schemas/error-v1.schema.json`:

```json
{
  "error": {
    "code": "artifact_hash_mismatch",
    "message": "The uploaded artifact did not match the manifest.",
    "retryable": false
  }
}
```

| HTTP | Stable code | Retryable | Meaning |
|---:|---|:---:|---|
| `401` | `unauthorized` | false | Missing/invalid bearer token |
| `415` | `unsupported_media_type` | false | Unsupported outer or artifact type |
| `400` | `multipart_invalid` | false | Multipart framing cannot be parsed |
| `400` | `manifest_part_count_invalid` | false | Manifest part absent or duplicated |
| `400` | `idempotency_key_missing` | false | Header absent |
| `400` | `idempotency_key_invalid` | false | Header is not a UUID |
| `400` | `idempotency_key_mismatch` | false | Normalized header/manifest UUID differs |
| `400` | `manifest_hash_missing` | false | Manifest-hash header absent |
| `400` | `manifest_hash_invalid` | false | Header is not 64 lowercase hex |
| `400` | `manifest_hash_mismatch` | false | Header differs from exact manifest bytes |
| `400` | `manifest_invalid` | false | JSON/schema/application rule fails |
| `400` | `artifact_duplicate` | false | A physical unique-hash part is repeated |
| `400` | `artifact_identity_invalid` | false | Artifact filename is missing/path-bearing/not strict hash plus extension |
| `400` | `artifact_missing` | false | Declared unique hash has no part |
| `400` | `artifact_unexpected` | false | Uploaded unique hash is undeclared |
| `400` | `artifact_byte_count_mismatch` | false | Exact length differs |
| `400` | `artifact_hash_mismatch` | false | Exact SHA-256 differs |
| `400` | `audit_json_invalid` | false | Audit is not a JSON array |
| `400` | `invalid_jpeg` | false | JPEG structure/decode/dimension rule fails |
| `409` | `run_manifest_conflict` | false | Owner/run already reserved with another hash |
| `413` | `package_too_large` | false | Configured body/part/pixel/count limit fails |
| `503` | `evidence_persistence_unavailable` | true | Durable Storage/database unavailable |
| `500` | `unexpected_server_error` | true | Safe unexpected failure |

Messages are bounded and safe. Never return credentials, provider responses,
stack traces, private paths/URLs, or raw evidence.

## 9. Persistence, idempotency, and concurrency

Use the normative two-transaction algorithm in
`06-PERSISTENCE-CONCURRENCY-AND-RECOVERY.md`:

1. validate completely;
2. transactionally create/read `(ownerKey, normalizedRunId)` reservation with
   manifest hash, one receipt ID, and `receiving` state;
3. create manifest/artifact objects privately with create-only preconditions,
   verifying any already-existing object;
4. transactionally transition the exact reservation once to `received` and
   persist the immutable receipt.

Same owner/run/same manifest resumes or returns the receipt. A different
manifest conflicts even while the first request is incomplete. A crash after
objects but before finalization remains truthfully `receiving`; retry completes
it. No Storage/database failure returns a receipt.

Suggested server-owned object namespace:

```text
vista/inspection-packages/{ownerKey}/{normalizedRunId}/
  manifest/{manifestSha256}.json
  artifacts/{artifactSha256}
```

Do not use UID text, raw multipart filenames, or device-relative locations as
path components. A verified computed hash—not the filename text—names an
artifact object.

## 10. Success receipt

The normative schema is `schemas/receipt-v1.schema.json`; the golden body is
`fixtures/valid/receipt.json`.

- First finalized receipt returns `201`.
- An identical request that observes the existing receipt returns `200`.
- Both return the same receipt ID, `receivedAt`, and body.
- `artifactSha256` is the complete unique accepted transport set in lexical
  order, including the audit-export file hash.
- `analysisStatus` is exactly `notRequested` in v1 and never changes on retry.
- `received` means the declared set was verified and durable. It does not mean
  recognition success, server confirmation, human acceptance, C07 chain
  verification, or device attestation.

## 11. Server analysis is not part of this endpoint

The upload handler does not call OpenAI and does not wait for analysis. A future
worker or retrieval endpoint requires a separate decision and versioned server
assessment that never overwrites the local result. Do not set `pending` in this
v1 receipt merely because future analysis is imagined.

## 12. Runtime limits and deployment decisions

Before deployment, confirm the actual server runtime, middleware buffering,
Firebase project/region/bucket/database, data residency, retention, and exact
manifest/audit/image/pixel/count/total limits. These are listed in
`07-ENVIRONMENT-DECISIONS-REQUIRED.md`.

If a complete real package cannot fit the measured platform limit, stop rather
than truncate it. That is the evidence threshold for proposing resumable
transport. It does not justify silently weakening this receipt contract.

## 13. Why each minimum requirement exists

| Requirement | Mandatory reason |
|---|---|
| Firebase bearer token | Prevent anonymous submission and derive owner safely |
| Owner-safe key | Prevent UID/path injection and isolate tenants |
| Run ID/idempotency key | Group one transport package and make lost responses safe |
| Manifest | Define the exact set the server is being asked to receive |
| Audit export | Preserve local decision/provenance evidence as submitted |
| Hashes and byte counts | Detect wrong, truncated, or corrupted bytes |
| Exact unique-set validation | Prevent an undeclared or missing part from becoming success |
| Strict JPEG validation | Refuse relabeled/concatenated/unsafe image input |
| Reservation and immutable writes | Resolve concurrency and prevent replacement |
| Hash-bound receipt | Let the phone verify exactly what the server accepted |
| Receipt separate from analysis | Keep model/provider failure from invalidating upload |

Nothing else is mandatory for this first endpoint. Resumable sessions, signed
receipts, reviewer UI, server AI, assessment retrieval, retention automation,
and production deployment remain separate decisions.
