# Sprint 005 — Sprint Plan Tasks

HumanReviewerInitials: PME

## Purpose

Translate the approved Sprint Plan into ordered, component-scoped implementation tasks for the VISTA package-ingest endpoint.

## Governing artifacts

- [Sprint Plan](01-sprint-plan.md)
- [Component architecture](../../../06-solution-design-and-architecture/components/component-architecture.md)
- [VISTA endpoint handoff](../../../../server/contracts/vista-server-endpoint-agent-handoff-v0.1/README.md)

## Approved operational limits

- Pin direct dependencies `busboy@1.6.0`, `ajv@8.20.0`, and `ajv-formats@3.0.1`; no multipart wrapper or copied schema is authorized.
- Maximum manifest: 256 KiB; audit artifact: 5 MiB; each JPEG: 5 MiB; complete multipart request: 25 MiB.
- Each JPEG is at most 4,096 pixels on either axis and 16,777,216 decoded pixels.
- The manifest may contain at most 40 logical artifacts: exactly one audit plus at most 39 JPEG descriptors.
- Accept at most 40 unique physical artifact parts and 41 total parts including the one manifest; no other fields or parts are allowed.
- Every limit is explicit and fail-closed; missing or invalid configuration prevents startup.

## Ordered implementation tasks

1. **Inspection API** — Write the RED contract tests, declare the three exact dependencies above, add fail-closed limit configuration, verify Firebase identity, and derive lowercase SHA-256 `ownerKey` plus normalized run ID without logging raw credentials.
2. **Inspection API** — Stream and bound the multipart body, enforce exact part identities/counts, validate the manifest with the vendored schema and application rules, and produce the stable contract errors in required precedence.
3. **Evidence Store** — Verify exact manifest, audit, and JPEG bytes, hashes, counts, media and JPEG limits; write only to private create-only hash paths and verify any pre-existing object without overwrite.
4. **Inspection Record Store** — Implement the transactional `receiving → received` reservation, conflict, retry, finalization, immutable receipt, and crash-recovery contract for `(ownerKey, normalizedRunId)`.
5. **Inspection API** — Orchestrate the three components at `POST /v1/vista/inspection-packages`, return `201`, idempotent `200`, `409`, and bounded failures with `Cache-Control: no-store`, and emit redacted diagnostics.

## Task rules

- Execute in order; each task changes only its named component and component-owned tests.
- Every behavioral task starts with the smallest expected RED test and records RED/GREEN commands.
- A cross-component correction becomes a new ordered task and requires renewed approval.
- Deployment, production data, retention/deletion, iPhone work, and changes to `/inspections` remain unauthorized.

## Validation

After task 5, run the handoff verifier, complete fixture and negative-path matrix, concurrent identical/conflicting retry, crash/storage/finalization recovery, cross-owner and logging-redaction tests, Firebase emulator integration, existing `/inspections` regression suite, and `git diff --check`; record real pass/fail/skip counts and limitations.

Coding begins only after this exact document is human-approved and fully staged.
