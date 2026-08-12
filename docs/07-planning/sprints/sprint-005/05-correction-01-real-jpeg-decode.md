# Sprint 005 Correction 01 — Real JPEG Decode

HumanReviewerInitials: PME

## Conflict

The approved endpoint contract requires every submitted image to contain
exactly one decodable JPEG. The approved dependency list contains schema and
multipart packages only. Marker, segment, table, and dimension checks cannot
prove that compressed entropy decodes into the declared pixels.

## Proposed bounded correction

- Add exactly `sharp@0.35.3` as a direct pinned server dependency.
- Decode each hash-verified JPEG sequentially to raw pixels with invalid-input
  warnings treated as failures and the approved pixel ceiling applied.
- Require decoder format `jpeg` and dimensions equal to the structural reader.
- Preserve and store the submitted JPEG bytes unchanged; decoded bytes are
  validation-only and are never persisted.
- Map decode, format, dimension, and resource failures to `invalid_jpeg`.
- Add RED tests for impossible Huffman data, insufficient entropy, truncated
  data, concatenated JPEGs, pixel/axis limits, and the vendored valid fixture.

## Scope and consequences

This correction changes only the Evidence Store validation task and its tests.
It does not authorize another endpoint, image transformation, analysis,
deployment, production data, IAM changes, or changes to `/inspections`.

`sharp@0.35.3` supports Node.js 20.9 or newer, ships common prebuilt binaries,
and uses Apache-2.0 licensing. The build/runtime artifact becomes larger and
must be verified in the declared Firebase Node 22 environment.

## Approval effect

PME initials plus staging of this exact document authorize the dependency,
RED/GREEN implementation, lockfile update, and applicable regression tests.
Without approval, the current implementation remains a non-acceptable partial
candidate and must not return production VISTA receipts.
