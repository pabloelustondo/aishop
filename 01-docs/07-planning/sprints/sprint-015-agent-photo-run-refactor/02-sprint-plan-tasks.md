# Sprint 015 — Sprint Plan Tasks

Date: 2026-09-16. Status: proposed; approval is Pablo's commit.
Prerequisite: [Sprint Plan](01-sprint-plan.md) approved at `71c8de7`.
Branch: `codex/sprint-015-agent-photo-run-refactor`.
Read [scope, ownership and compatibility](03-scope-and-compatibility.md) with these tasks.

## Execution rules

Each task owns one approved component; characterize behavior before extraction.
Run its existing tests and add missing cases before changing implementation.
Record existing failures separately; no live provider calls, deployment or scope expansion.

## Ordered tasks

1. **Inspection API — baseline.** Save separate local test/E2E command scripts;
   run full server tests and `./e2e/server/run.zsh` before refactoring.
   Record commit, commands, results and simulated edges under review/release evidence.
2. **Evidence Store — source contract.** Test/document owner-scoped `readSource()`,
   exact JPEG bytes/media type and unavailable-source errors. Keep the store in place;
   explain its role in the photo flow without changing persistence or upload code.
3. **Inspection Record Store — state contract.** Test/document reservation, run history,
   provider linkage, leases, duplicate/stale work and terminal settlement.
   Preserve context/refine rules and run/attempt fencing; no store relocation or rewrite.
4. **AI Analysis Adapter — recognition helpers.** Extract background request-body
   building and response interpretation into `recognition/background/`, with READMEs.
   Preserve factory exports, transport, prompts and schemas; snapshot requests/results.
5. **Inspection API — run input.** Extract JSON `readContext()` into `agent/api/`;
   keep dispatch, authorization, serialization and other handlers in their current file.
   Test empty/malformed/oversized input, trimming, ownership and unchanged HTTP errors.
6. **Inspection API — start orchestration.** Move the existing runner into
   `agent/analysis/` behind a same-export compatibility facade at its old path.
   Test operation order, one provider start, ambiguous starts and failed task dispatch.
7. **Inspection API — collection.** Move the collector into `agent/analysis/`
   behind its old export; test pending/retry, terminal failure, stale delivery and cleanup
   after durable settlement. Preserve shared video behavior and queue/function settings.
8. **Inspection API — personal-review guide.** Update Spanish flow guides and API READMEs:
   sequence diagram, reading order, functions/paths, identifiers, inputs/outputs and errors.
   Link unchanged stores, prompt/schema, diagnostics, composition and reconciler directly.
9. **Inspection API — manual exercises.** Add separate small curl scripts for run,
   refine and status/report reads using an existing JPEG ID; save scripts before execution.
   Require explicit base/token; no cloud default, secrets in output or live paid execution.
10. **Inspection API — integration validation.** Extend only missing saved-photo `/run`
    coverage in the real emulator composition with simulated provider/task edges.
    Re-run server/E2E gates, old-export checks and links; record evidence and review gaps.

## Handoff

Pablo reviews the photo walkthrough; test success does not substitute for his acceptance.
Commit these Tasks and their scope companion before coding; no code has changed in this draft.
