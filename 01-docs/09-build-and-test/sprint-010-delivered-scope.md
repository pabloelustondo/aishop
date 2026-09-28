# Sprint 010 — Implementation and Local Validation

Date: 2026-09-08. Branch: `codex/sprint-010-agent-observability`.
Approved baseline: `c3a07f8`. Implementation is uncommitted and not deployed.

## Delivered behavior

- Structured allowlisted request/run/provider/stage events, explicit severity and validated trace mapping.
- Server-generated request references in response headers/error bodies and copy controls on the page.
- Transaction-reserved run IDs and initial/refine/retry triggers, with stale-run settlement protection.
- Per-run configuration fingerprints, nullable provider metadata, usage and available stage timings.
- Explicit output-limit, incomplete, refusal, HTTP, transport, timeout, JSON and schema diagnostics.
- Provider metadata survives parsing failure; existing analyzer report returns remain compatible.
- Original provider failure survives a secondary settlement failure; unsettled runs emit no false saved outcome.
- Generic provider failure wording no longer asserts the model could not be reached.
- [Query guide](../12-observability-insights-and-learning/observability-02-agent-query-guide.md) covers request/run lookup and overdue-run inspection.

## Verification

- Full server suite after review corrections: 277 tests, 277 pass, zero failures under local Node 26.
- Pre-review 273 tests passed under bundled Node 24; deployed Node 22 was not exercised locally.
- `./e2e/server/run.zsh`: all six steps pass, final process exit 0.
- Step 06 uses real agent composition, Auth/Storage/Firestore emulators and a fixture provider transport.
- It proves successful initial/refine/retry history, persisted output-limit metadata and request/run correlation.
- Two concurrent Firestore reservations produce exactly one winner and one recorded run.
- Removing only its own emulator record during provider failure proves secondary persistence-failure logging.
- Private markers in filenames, notes and provider text are absent from events and diagnostic summaries.
- Unit coverage distinguishes 429/5xx, refusal, incomplete, JSON/schema, transport and timeout outcomes.
- Browser fixtures at 1440/900 px: no overflow, confidence keyboard focus, selectable/copyable references and visible failure reference.
- Reviewer signed-in/out screenshots match pre-sprint `c3a07f8`; browser console errors: none.
- [Browser evidence](sprint-010-browser-evidence/) contains success/failure views and reviewer comparison images.
- `git diff --check` passes; governed sprint documents remain at most 50 lines and unchanged.

## Execution notes and remaining acceptance

- Initial emulator assertions passed but sandboxed Firebase shutdown exited 2; the final elevated run exits 0.
- Terminating the Firestore SDK produced its own unhandled rejection; the final fixture uses isolated record removal instead.
- Firebase logger `write` emits the sanitized envelope directly, avoiding an automatically generated logger stack.
- Optional diagnostics observers and fixture transport injection preserve existing adapter return contracts.
- Raw reports/notes remain in their existing business records; the new diagnostic fields never duplicate that private content.
- Current settlement duration is available in logs, not in the same write whose duration is being measured.
- Browser checks use fixture auth/API data and local actual assets; they do not prove live identity or provider quality.
- Release identity prefers a valid commit override, then automatic `K_REVISION`; `releaseKind` distinguishes them.
- Live TEST deployment, searchable cloud fields, platform trace linkage and hosted-page verification remain pending.
- No paid provider requests, secret changes, token-cap changes, commits, merges or deployments were performed.

- Review corrections: one output-cap constant; API/diagnostic error-code parity test; sanitizer formatted for readability.
- Timing correction: `provider` remains the runner stage; `provider_transport` covers adapter transport/body decoding.
- Regression tests cover cap/request agreement, allowlist parity, distinct persisted timers and commit/revision fallback.
- Claude reports Node 22.23.2: 232 pass, 20 sharp-related failures, 259 total; totals do not reconcile, so this is partial evidence.
