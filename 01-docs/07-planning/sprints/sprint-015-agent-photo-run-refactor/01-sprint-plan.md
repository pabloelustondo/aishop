# Sprint 015 — Agent Photo Run: Refactoring and Code Documentation

Date: 2026-09-16. Status: proposed; approval is Pablo's commit.
Branch: `codex/sprint-015-agent-photo-run-refactor`; base: `dev` at `cbc68ad`.

## Goal

Pablo can personally follow, explain and review the implementation of
`POST /v1/agent/analyses/{id}/run` for an already-stored JPEG photograph.
Improve code navigation and readability without changing observable behavior.

## Scope: request to persisted report

- Follow dispatch, Firebase authorization, owner isolation and optional `context`.
- Follow run reservation, reading the stored original and provider submission.
- Explain `areaScan`: instruction, context, image, JSON schema and response validation.
- Follow durable provider identity, task scheduling, collection and report settlement.
- Explain pending/failure paths, leases, run/attempt fencing, reconciliation and cleanup.
- Read Firebase composition, stores and helpers only where this flow depends on them.
- Extract or group only necessary code into focused modules with a README each.
- Keep existing shared entrypoints/interfaces; avoid moving whole unrelated modules.

## Documentation for personal review

- Extend [server-side-analysis](../../../guides/server-side-analysis/README.md) in Spanish.
- Provide a high-level sequence separating the HTTP response from background work.
- Map every step to the real function and clickable source location.
- Show full repository-relative paths in visible link labels, not just basenames.
- Explain inputs, outputs, state writes, callers, invariants and why each step exists.
- Include a reading order, glossary of identifiers, safe example payloads and failures.
- Add small saved scripts to exercise this flow and read status/report; no bulk suite.
- Document existing-photo/auth prerequisites; uploads are setup, not sprint scope.

## Acceptance and validation

- Pablo can trace `runner.run → analyzer.start → collector.collect → stored report`.
- All necessary dependencies are discoverable without reading unrelated server flows.
- Existing routes, auth, contexts, prompts, schemas, data and background semantics match.
- Tests cover a saved JPEG, pending/completed/failed responses and duplicate/stale work.
- Record baseline/post-refactor server tests and `./e2e/server/run.zsh`; distinguish prior defects.
- Use emulators and simulated provider edges; extend only missing photo-run coverage.
- Shared-code callers retain regression coverage; verify imports, resources and links.
- No live provider spend or deployment is included; manual acceptance remains explicit.

## Exclusions and gates

No upload/video/UI changes, new endpoints, catalog/model/cost features or global reorganization.
The [90-file proposal](../../proposals/server-source-modules.md) remains broader deferred work.
Client Upload Events is [deferred](../../proposals/client-upload-events.md), not Sprint 015.
After this Plan is committed, draft separate component-scoped Tasks; commit them before coding.
