# Prompt — Function Memory and Realistic Package Measurement

Authorized by Pablo on 2026-08-13. Immutable once activated.

## Environment

Firebase project `aishop-99d36`, designation **test**, confirmed by
Pablo on 2026-08-13; the only authorized target. No production
environment exists. If anything you observe contradicts this, stop and
ask — do not resolve it yourself.

## Why

The deployed `functions:api` runs at 256 MiB. A local run of the
handler peaked near 332 MiB, and the smoke test that passed used an
865-byte image. A real inspection carries roughly a dozen photos at
3–5 MB, so the first genuine iPhone upload is the likeliest thing to
fail — and it would fail looking like a client defect.

## Task 1 — Raise the ceiling

Raise the `api` function's memory to 1 GiB and redeploy
**`functions:api` only** — no other function, no rules, no indexes, no
hosting. Record the exact deploy command and its output. This
authorization covers this one deploy to this one environment; any
further deploy needs Pablo's authorization for that exact action.

## Task 2 — Measure a realistic package

Build a package resembling a real run — about 12 JPEG artifacts at 3–5
MB each plus the audit-events artifact — with correct per-artifact
SHA-256 values and a manifest that validates against
`schemas/manifest-v1.schema.json`. Submit it to the deployed endpoint
with real authentication.

Record, as evidence: total package bytes; HTTP status; wall time from
first byte sent to receipt received; peak function memory from the
Cloud Functions metric; and any cold-start effect. Then repeat the
identical submission and confirm the same receipt with no duplicate
Firestore record and no duplicate Storage object.

## Constraints and stop

Do not change the handler, the contract, the schemas, or the tests to
make the measurement pass. If it fails, record the failure with its
evidence — that is the useful result. Do not commit, push, or open a
pull request. Stop at `AWAITING_INDEPENDENT_REVIEW`, with the
measurements written to `docs/11-operational-reality/`.
