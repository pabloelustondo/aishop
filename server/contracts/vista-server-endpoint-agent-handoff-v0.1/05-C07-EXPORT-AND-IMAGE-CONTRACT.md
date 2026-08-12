# C07 Audit Export, Sealed Manifest, and Image Compatibility

This document records the exact VISTA facts the server contract depends on.
It prevents the receiving agent from inferring C07 semantics from a sample
payload or from the older AI-Shop implementation.

## 1. Audit export shape

VISTA `TimelineExporter.exportJSON` encodes a JSON array of `ChainedEvent`
records. Each record has exactly this conceptual shape:

```json
{
  "chainHash": "<64 lowercase hex>",
  "event": { "<AuditEvent v2 fields>": "<values>" },
  "previousHash": "<64 lowercase hex>"
}
```

The `AuditEvent` envelope includes the event schema/version, ID, sequence,
run ID/kind, UTC and monotonic time, category/name/actor, optional state and
causal/context fields, run versions, optional decision/operation/failure,
bounded payload, artifact references, severity, privacy, and retention.
Optional Swift `nil` fields are absent from encoded JSON.

An `ArtifactRef` contains:

```json
{
  "id": "<artifact ID>",
  "sha256": "<content hash>",
  "kind": "<domain kind>",
  "mediaType": "<recorded media type or null>",
  "byteCount": 123,
  "relativeLocation": "<device-local relative location or null>"
}
```

The device-local `relativeLocation` is evidence metadata. The server must not
use it as a Storage path and must never interpret it as authority.

## 2. Canonical chain algorithm

VISTA encodes each event with JSON keys sorted, slashes unescaped, and dates in
ISO-8601 form. Chain materialization is:

```text
genesis = 64 ASCII zeroes
chainHash[0] = SHA256(genesis + canonicalJSON(event[0]))
chainHash[n] = SHA256(chainHash[n-1] + canonicalJSON(event[n]))
```

Sequences begin at zero and are gapless. `previousHash` must equal genesis for
the first record and the previous record's `chainHash` thereafter.

The fixture generator in `scripts/generate-valid-fixture.mjs` follows this
algorithm. `scripts/verify-handoff.mjs` independently recomputes it.

## 3. The sealed manifest is a hash

The C07 value named `sealedManifest` in this wire contract is the existing
immutable 64-lowercase-hex digest returned by VISTA `sealRun`:

```text
SHA256(
  "manifest:" + finalChainHead + ":" +
  sort(unique(all artifact SHA-256 values referenced by the chain)).join(",")
)
```

The audit-export file is produced after the chain is complete. Its file hash is
therefore **not** included in the C07 sealed-manifest preimage. Do not hash the
textual preimage into the wire field and do not add the audit-export hash to
the C07 artifact set.

## 4. What endpoint v1 verifies

Endpoint v1 must:

- preserve the exact audit-export bytes;
- verify the audit file's declared byte count and SHA-256;
- require syntactically valid JSON with a top-level array; and
- store the manifest's `terminalChainHash` and `sealedManifest` as integrity
  anchors.

Endpoint v1 does **not** claim to reimplement VISTA's C07 chain verifier or
prove that a submitted audit came from an untampered genuine device. The valid
fixture is C07-chain-consistent to remove ambiguity from testing, but the
minimum production handler may treat the audit's semantics as untrusted
evidence. Consequently, its receipt proves completeness against the submitted
transport manifest, not completeness against every artifact in the local C07
run.

Stronger device-origin, chain, and accepted-image completeness attestation
requires a separately approved audit schema/verifier or signed device
attestation. It is outside this one-endpoint increment.

## 5. Current image-media compatibility

The current iPhone capture path calls default `AVCapturePhotoSettings()`, saves
`fileDataRepresentation()` unchanged, and stages the artifact through an API
whose default recorded media type is `application/octet-stream`. Existing
field evidence contains bytes that are JPEG, but the current C07 media-type
metadata does not guarantee JPEG for every run.

This endpoint version intentionally accepts only one structurally decodable
JPEG per image part:

- Preferred future behavior: the iPhone explicitly produces JPEG and records
  `image/jpeg` when staging the C07 artifact.
- Legacy-compatible behavior: the package builder may transmit existing bytes
  unchanged and declare transport type `image/jpeg` only after those exact
  bytes are positively detected and decoded as one JPEG. The original audit
  remains byte-for-byte unchanged, including its historical
  `application/octet-stream` value.
- HEIC, HEIF, concatenated images, unknown bytes, or a re-encoded derivative
  are not silently relabeled. They are ineligible for v1 unless the iPhone
  first creates and audits a new artifact under a separately approved change.

The server stores exact original bytes. It must not strip EXIF or re-encode the
image under the same hash. Because exact bytes can contain EXIF metadata, the
development project, access policy, retention decision, and region must be
approved before real field evidence is uploaded.

## 6. VISTA source evidence used for this contract

The originating VISTA paths are included for traceability; they will not exist
inside the receiving server repository:

- `Vista/Core/Services/Audit/TimelineExporter.swift`
- `Vista/Core/Services/Audit/AuditStore.swift`
- `Vista/Core/Models/AuditEvent.swift`
- `Vista/Core/Services/Persistence/SQLiteAuditStore.swift`
- `Vista/Core/Services/Capture/LiveObservationSource.swift`
- `Vista/Core/Services/Audit/AuditRecorder.swift`
- `Vista/Features/Inspection/InspectionViewModel.swift`
- `docs/12_code_documentation/05-c07-audit-evidence-durable-storage-and-reports.md`
