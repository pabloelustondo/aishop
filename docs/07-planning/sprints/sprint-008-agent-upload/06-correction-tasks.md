# Sprint 008 — Correction Tasks

From [the independent review](../../../09-build-and-test/sprint-008-independent-review.md),
revised on Pablo's adjustments 2026-09-07. Proposal for agreement.
`AGENTS.md` blocks executable changes while a governing document is
uncommitted; two are — this one, and [05](05-run-decision-and-correction-tasks.md) for tasks 4a to 4c.

## Ordered tasks

1. **Page — Retry preserves the note.** `dashboard/scripts/agent.js`.
   Retry resends that failed run's own context. Today it sends null, so
   retrying a failed refinement silently asks a different question.
2. **Page — refuse a blank refinement.** Same component. Whitespace
   passes the input's `required` check and becomes a bodyless rerun.
   Refuse before the call.
3. **Store — a reopened `analyzed` record requires a note.**
   `agent-analysis-store.js`. The page is not the enforcement point.
   Throws a new typed `AgentAnalysisContextRequiredError`; reopening
   from `uploaded` or `failed` is unchanged.
4. **Handler — an error contract for that refusal.**
   `agent-api-handler.js`, `agent-api-error.js`. New code
   `context_required`, 400, not retryable. `analysis_state_invalid`
   would be a 409 hiding the remedy; unmapped makes it a 500.
5. **Handler — log a route, never a path.** Same component. Log the
   matched route template or operation name, and `unmatched` when no
   route matched.
6. **Emulator suite — both secrets local, no provider call.** `e2e/`
   and its Firebase configuration. The function declares
   `OPENAI_API_KEY` **and** `AI_SHOP_CLIENT_TOKEN`; overriding one
   leaves a Secret Manager lookup. `run.zsh` supplies empty local
   values for both, preserving any existing `server/.secret.local`
   under a trap, so one command is reproducible and a developer's file
   survives. Gitignored configuration still changes behaviour, which is
   why it is recorded here. Verify: no Secret Manager request, no
   provider call, run settles `failed`.
7. **Store — correct the previous-report comment.** The page renders
   reports only in `analyzed`, so the claimed visible-while-refining
   benefit does not exist. Showing prior rows stays a separate UI
   proposal.
8. **Store — successful-refinement persistence, unpaid.** An
   integration test driving the store against the Firestore emulator:
   store a representative successful report, reopen with a context,
   settle again, assert both run entries carry their own context and
   report. No HTTP, no provider. Recognition quality still needs the
   manual test against a real key.

## Validation

Full server suite, `./e2e/server/run.zsh`, a whitespace check, real
counts into the delivered-scope report, each task from its own failing test.
