# Sprint 014 — Cancellation and Recovery Tasks

Status: Proposed; approval requires Pablo's commit.
Prerequisites: recovery plans approved at `7c0329d`.

## Fixed interfaces

- Every active video stage carries a new opaque attempt identifier.
- Settling writes compare both expected status and attempt identifier.
- Cancellation is a durable compare-and-set completed before cleanup calls.
- Bulk cleanup previews candidates, then submits exact record versions.
- Restart creates a new attempt and resumes at processing or analysis according
  to the durable outputs already present.

## Ordered component-scoped tasks

1. **Analysis store.** Test and add versioned cancellation, attempt creation and
   fenced transitions; persist source-complete state, task identity and cleanup facts.
2. **Video task enqueuer.** Test and put the attempt identifier in the task
   payload and deterministic name; return the full deletable task identity.
3. **Video processor.** Test and require the current attempt before settlement;
   write frames under its prefix and read only frames from that attempt.
4. **Provider runner.** Test and bind provider start and settlement to the current
   attempt and expose best-effort cancellation by stored response identifier.
5. **Evidence store.** Test and add best-effort session invalidation without
   deleting source evidence or analysis history.
6. **Agent API.** Test and add owner-scoped cancel and restart routes; persist
   returned task identity, cancel first, then clean up with precise outcomes.
7. **Admin API.** Test and add stale-upload preview with an injected clock, plus
   confirmed cancellation that rechecks claims, version, status and identity.
8. **Agent presentation.** Test and show explicit Resume, Cancel upload, Start fresh,
   Cancel analysis and Restart analysis actions from durable server state.
9. **Admin presentation.** Test and show candidate age and warning, require selection
   plus confirmation, and render per-record cleanup outcomes.
10. **Diagnostics.** Test and allowlist cancellation stage, mismatch and cleanup
    outcomes without exposing task names, response IDs or upload-session URIs.
11. **Integration tests.** Cover authorization, transition races, stale attempts,
    exact-version cleanup, partial cleanup failure, refresh and cross-tab state.
12. **E2E gate.** Prove cancel at every active stage, late-result rejection,
    one restart on stored evidence, bulk cleanup and photograph regression.

## Validation and release boundary

Run server unit tests, dashboard behavior tests, emulator E2E, diff checks and
governed-file line checks. Live cancellation, deployment, IAM, merge and release
remain separate actions. No existing TEST record is cancelled during validation.
