# Sprint 008 Corrections — Independent Review

Codex, 2026-09-07. Snapshot: `82119ed` plus the correction working tree.
Environment: macOS; Local emulators `demo-aishop-e2e`. No deployment performed.
Disposition: **changes required in task 6; Sprint 009 prerequisite not satisfied**.

## Findings

1. **P1 — Backup failure deletes the developer's secret file.** In `e2e/server/run.zsh:25-39`, the EXIT trap is installed while `HAD_SECRETS=0`. If `cp -p` fails, `set -e` exits before the flag changes; cleanup takes its removal branch and deletes the original `.secret.local`.
   Reproduced using the actual script copied into an isolated temporary tree, a fake sentinel file and a failing `cp` stub. Exit 1; the original fake file was gone. No real credentials were used or removed.
   Required correction: track original-file presence separately from successful backup/override creation; never remove the original on backup failure. Make cleanup idempotent and test success, command failure, backup failure and interruption with fake data.
2. **P2 — Empty overrides do not prevent Secret Manager requests.** The real emulator log still attempts both `OPENAI_API_KEY@latest` and `AI_SHOP_CLIENT_TOKEN@latest`, followed by Google Secret Manager 403 responses.
   The installed Firebase CLI explains why: `functionsEmulator.js:1048` filters missing overrides with `!secretEnvs[s.key]`, so empty strings count as missing. Task 6's proposed mechanism does not meet its requirement.
   Required correction: use locally satisfied secret declarations plus an explicit emulator-only provider-disable mechanism, or another verified offline design. Do not merely substitute a truthy fake OpenAI key; that activates the provider adapter. If composition must change, propose a separate component-scoped task first.

## Actual validation

- `npm --prefix server test`: **243 tests, 243 passed, 0 failed, 0 skipped**. Previous Mac run was 232/232: 11 additional passing tests.
- `zsh -n e2e/server/run.zsh`: pass.
- `./e2e/server/run.zsh`: exit 0; **all five steps pass**, despite the Secret Manager requests. An exit code alone does not prove task 6.
- Step 05 persists a representative successful report, refuses contextless reopening, then persists a second report and separate run history with its context and concrete timestamps against real Firestore emulation.
- Step 05 is a store integration test using supplied reports, not live recognition or a successful provider-backed HTTP refinement. The context rule is application code executed in a Firestore transaction, not a native Firestore validation rule.
- Step 04 uses the unconfigured analyzer and settles failed. Code inspection supports no OpenAI request on this path; this run is not a network-egress audit.
- No `.secret.local` existed before the normal run; its temporary replacement was removed afterward. Existing-file failure handling was tested separately with fake data as described above.
- `git diff --check`: pass. No executable changes were made during review.
- Temporary logs: `/private/tmp/sprint008-corrections-unit.log` and `/private/tmp/sprint008-corrections-e2e.log`.

## Remaining review conclusions

- Retry uses the failed run's context; blank refinement is refused in the page and on reopening an analysed store record.
- The handler maps the typed missing-context error to `context_required`, HTTP 400, not retryable.
- Handler error logs use fixed route templates or `unmatched`; the old caller-path logging is removed. The nearby comment still says “path” and should say “route”.
- The previous-report comment now distinguishes stored data from what the page displays. Pure helper tests do not replace browser acceptance coverage.
- Tasks 1, 2, 3 and 7 are committed; tasks 4, 5, 6 and 8 remain working-tree proposals in this snapshot. Review cannot reconstruct claimed RED-before-GREEN sequencing from final files alone.
- Sprint 009's rules require Sprint 008 corrections implemented and verified before task 1. Task 6 remains unmet; passing steps 01–05 does not remove that dependency.
