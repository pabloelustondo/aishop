# Sprint 010 — Agent Observability

Date: 2026-09-08. Status: PROPOSED; approval requires Pablo's commit.

## Goal and user stories

Pablo can copy a failed run's diagnostic reference and explain where it failed,
how long each stage took, which model/configuration ran and what the provider returned.
An operator can investigate failures and slow runs with saved queries and durable run diagnostics.
Recognition quality remains in the benchmark work; this sprint captures execution evidence.

## Scope

1. Structured, trace-correlated request and run events using the [contract](02-observability-contract.md).
2. Timings for validation, source storage/read, provider work, parsing/validation and persistence.
3. Safe provider diagnostics, usage and versioned configuration on successful and failed attempts.
4. Durable per-run diagnostic summaries, backward-compatible reads of existing records.
5. Page shows a copyable reference on failures and run details; no private provider details in the UI.
6. Reproducible Logs Explorer queries for a request/run, failures, stage timings and available usage.
7. A read-only diagnostic procedure for persisted runs that started but never settled.
8. Preserve the shared analyzer's existing consumers; diagnostic enrichment must not change report contracts silently.

## Acceptance

- One reference joins browser, API, runner and provider attempt events; trace metadata links platform logs.
- Every completed request has one terminal request event; every settled run has one terminal run event.
- Forced crashes may lack terminal events; overdue persisted runs are discoverable, never claimed completed.
- Provider 401, 429, 5xx, timeout, network, refusal, incomplete output, JSON and schema failures remain distinguishable internally.
- Failure while recording another failure preserves both causes; telemetry sink failure does not replace the business outcome.
- Actual model and available usage are retained even if report validation fails; unavailable values remain null.
- Safe fixture markers in credentials, notes, names, URLs and report text never enter telemetry.
- Existing records and reviewer dashboard remain functional; browser checks cover 1440 px and 900 px.
- Extend `./e2e/server/run.zsh` with real composition and a fixture provider transport, offline-safe and explicitly labelled.
- E2E proves upload/refinement correlation, failure classification, persistence failure and existing analyzer consumers.
- Live TEST evidence proves structured fields, trace linkage, new page references and diagnostic queries after deployment.
- The [output-limit regression](03-output-limit-acceptance.md) proves distinguishable diagnostics and accurate UI wording without paid calls.

## Boundaries and sequencing

Keep the synchronous Node agent path; no Python worker, queue, automatic retries or model selector.
No raw input/output capture, billable inference for testing, or accuracy claims from HTTP success.
Capture usage now; pricing-based cost calculation, dashboards, metrics resources and alerts are deferred.
Client telemetry collection and automated overdue-run monitoring are deferred; no new collection endpoint.
Document network failures without a server response as a remaining blind spot; do not invent a server reference.
Use existing retention initially; document it and review any retention, IAM or billing change separately.
Approve this plan and contract first; only then draft separate ordered, component-scoped Sprint Plan Tasks.
Tasks must map existing responsibility cards and approve any new telemetry component before coding.
Pablo commits the tasks before implementation on a dedicated sprint branch.
Deployment to TEST `aishop-99d36` requires explicit authorization; record exact commit and live acceptance evidence.
