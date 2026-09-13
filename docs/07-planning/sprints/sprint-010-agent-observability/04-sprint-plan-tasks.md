# Sprint 010 — Sprint Plan Tasks

Date: 2026-09-08. Status: PROPOSED; no executable changes authorized by this draft.
The plan and requirements were approved in `cb7e00d`; Pablo must commit this task plan and [ownership](05-component-ownership.md) before coding.

## Ordered component-scoped tasks

1. **Diagnostic formatter.** Add the bounded event/field formatter and safe emission wrapper.
   Prove field allowlists, explicit severity/trace mapping and sink exceptions cannot replace business errors.
2. **AI Analysis Adapter.** Add an optional diagnostic observer without changing the returned report shape.
   Capture metadata before validation; classify explicit output-limit incompleteness before parsing partial JSON.
   Fixture-test HTTP errors, timeout, refusal, incomplete, JSON/schema failures, usage and existing consumers.
3. **Agent analysis store.** Reserve immutable run ID and trigger from the transaction's prior state.
   Add nullable diagnostics to run summaries and closing transitions; legacy reads remain valid.
   Test concurrent reservation, initial/refine/retry classification and metadata on success/failure.
4. **Agent analysis runner.** Propagate request/run context to diagnostics and time source, provider and settlement stages.
   Persist safe provider metadata on failure as well as success; emit durable outcome only after settlement.
   Preserve the original error if failure persistence also throws; log both safe categories.
5. **Agent API handler.** Generate request IDs, validate trace context, time request/upload stages and emit terminal events.
   Return a diagnostic reference in the response header and safe error body; pass context to the runner.
   Prove auth failures lack fabricated run IDs and caller-controlled paths/headers cannot inject log fields.
6. **Firebase agent composition.** Wire structured logging, environment/release metadata and diagnostic dependencies.
   Keep the emulator provider isolation and other API consumers intact; verify the composed wiring.
7. **Agent page.** Display/copy request references on errors and persisted run diagnostics in run details.
   Correct generic provider wording; explain missing references on network failure without inventing one.
   Test legacy records, keyboard copy controls and request failures without server responses.
8. **Emulator suite.** Extend the existing command using an explicitly labelled fixture provider transport.
   Prove real composed upload/run/refine correlation and persisted output-limit diagnostics without external calls.
   Add fixture scenarios for secondary persistence failure and private-marker exclusion from logs/diagnostics.
9. **Operational evidence.** Write reproducible queries, overdue-run inspection steps and actual validation results.
   Record remaining blind spots and separate fixture, browser and post-deployment evidence.

## Interfaces fixed before implementation

- Formatter accepts finite event fields; context carries request ID, trace and release metadata, never request objects.
- Adapter observer receives sanitized metadata; observer failure cannot alter the report or provider failure.
- Store reservation returns run identity/trigger atomically; closing calls target that identity.
- Runner accepts optional diagnostic context; existing callers remain compatible.
- Keep public failure codes stable; internal failure classes and safe request reference are additive.
- Persist configured model/cap/version metadata at run start; unknown returned model/usage stay null.

## Execution and acceptance

After both new documents are committed, create `codex/sprint-010-agent-observability` from the approved checkout.
Each task changes only its [owned component](05-component-ownership.md), including its associated tests.
Run focused behavioral tests per task, then `npm --prefix server test` and `./e2e/server/run.zsh`.
Verify the agent page at 1440/900 px and keyboard navigation; compare reviewer screenshots against the pre-sprint commit.
Verify [output-limit acceptance](03-output-limit-acceptance.md), redaction and shared-adapter regression evidence.
No deploy is implied: after authorization, deploy the reviewed commit and verify structured fields and references live.
Agents do not commit or merge; document failed/skipped checks without calling the sprint complete.
