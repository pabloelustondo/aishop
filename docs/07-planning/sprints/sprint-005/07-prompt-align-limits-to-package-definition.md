# Prompt — Align Approved Limits to the Package Definition

Authorized by Pablo on 2026-08-13, including the redeploy named below.
Immutable once activated.

## Environment

Firebase project `aishop-99d36`, designation **test**, per
`docs/11-operational-reality/operational-02-environment-designation.md`;
the only authorized target. If anything contradicts this, stop and ask.

## Why

Pablo defined the inspection package on 2026-08-13: one shelf area of
4 ft × 6 ft, one global capture, up to 20 detail captures, one audit
artifact — 22 artifacts, 25 MiB. Source of truth is VISTA
`docs/02_product_contract/vista-inspection-package-definition.md`.

The limits raised earlier that day predate the Cloud Run 32 MiB request
ceiling being known. A 100 MiB cap is unreachable: the platform rejects
opaquely before the handler can return `413`.

## Task 1 — Correct the approved limits

In `server/src/vista-package-limits.js`:

| Limit | From | To |
|---|---:|---:|
| `packageBytes` | 104_857_600 | 26_214_400 |
| `artifacts` | 40 | 22 |
| `artifactParts` | 40 | 22 |
| `multipartParts` | 41 | 23 |

Leave `manifestBytes`, `auditBytes`, `jpegBytes`, `jpegAxis`, and
`jpegPixels` unchanged. Update every place these are asserted, including
the `.env` the fail-closed startup verifier compares against and the
test-support limit values. RED first on the config gate.

The vendored manifest schema's `maxItems: 100` is checksum-protected and
must not be edited; server-side limits enforce. Record that they differ.

## Task 2 — Redeploy and verify

`firebase deploy --only functions:api` — this one function only. Then
confirm the live revision reports the corrected `VISTA_MAX_PACKAGE_BYTES`
and that memory remains 1,024 MiB. A deploy may settle after the command
returns without a conclusion; re-verify before reporting failure.

## Constraints and stop

Do not weaken validation or hashing. Do not commit, push, or open a pull
request. Stop at `AWAITING_INDEPENDENT_REVIEW`, results recorded in
`docs/11-operational-reality/`.
