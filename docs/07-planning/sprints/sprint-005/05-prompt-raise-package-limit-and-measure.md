# Prompt — Raise the Package Limit and Measure at the Ceiling

Authorized by Pablo on 2026-08-13. Immutable once activated.

## Environment

Firebase project `aishop-99d36`, designation **test**, per
`docs/11-operational-reality/operational-02-environment-designation.md`;
the only authorized target. If anything contradicts this, stop and ask.

## Why

`api` now runs at 1 GiB, verified live on 2026-08-13. The remaining blocker
is `packageBytes`, currently 26_214_400. A real inspection carries a dozen
or more JPEGs, and the uploader cannot compress them: the manifest declares
SHA-256 hashes of committed local evidence and the bytes sent must equal
those hashes. Either the limit fits real evidence, or it can never be sent.

## Task 1 — Raise the approved limit

Change `packageBytes` in `server/src/vista-package-limits.js` to
**104_857_600**, and update every place the approved value is asserted,
including the `.env` value the fail-closed startup verifier compares
against. Leave `jpegBytes`, `auditBytes`, `artifacts`, `artifactParts`, and
`multipartParts` unchanged.

100 MiB is 20 JPEGs at the existing 5 MiB ceiling, below the 200 MiB the
artifact count permits, so the request cap stays the binding constraint.

## Task 2 — Measure at the ceiling

Submit packages of roughly 25, 60, and 100 MiB to the deployed endpoint,
authenticating by anonymous Firebase sign-up through the Identity Toolkit
REST endpoint. Record for each: total bytes, HTTP status, wall time, and
peak function memory from the Cloud Functions metric.

The question is whether 1 GiB survives a 100 MiB package. A prior local
peak of ~332 MiB on a small package suggests memory scales with body size.
**If peak memory exceeds roughly 700 MiB at any size, stop and report
rather than raising memory again.**

Then repeat one submission identically and confirm the same receipt, with
no duplicate Firestore record and no duplicate Storage object.

## Constraints and stop

Do not weaken validation, hashing, or per-artifact limits to make a
measurement pass; a failure recorded with its evidence is the useful
result. Do not commit, push, or open a pull request. Stop at
`AWAITING_INDEPENDENT_REVIEW`, results in `docs/11-operational-reality/`.
