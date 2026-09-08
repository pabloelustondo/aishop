# Sprint 011 — Task Rules and Validation

Companion to [04-sprint-plan-tasks.md](04-sprint-plan-tasks.md).

## Task rules

- Execute in order within each half. Each task changes only its named component and that component's own tests.
- Tasks 1–7 start with the smallest failing test; RED and GREEN commands are recorded in the delivered-scope report.
- Tasks 9–11 have no automated coverage; each records what was checked by hand and in which browser.
- A correction needing a second component becomes a new ordered task and needs Pablo's approval first.
- No `vista-*` import. No change to `firebase.json` rewrites, function options or runtime.
- Logs never carry the email, the password, the token, the claims object, the context text, the file name or the owner hash. `forbidden` is logged as the code alone.
- The administrator tool never prints a token or a password; it authenticates with the developer's own Application Default Credentials and refuses to run without an explicit `--project`.
- Guides show a fake email, a placeholder password and `{webApiKey}`; never a real credential, even a TEST one.
- Node: the full suite runs on Node 22 at least once before the sprint is declared delivered; the count is recorded.

## What stays unauthorized

Deployment, self-registration for the agent, API keys, quotas, rate limiting, production data, retention changes,
iPhone work, catalog matching, any queue or second runtime. A commit, push, or merge is Pablo's act.
Granting the claim to any account is Pablo's act, with the tool, on his machine.

## Validation after task 8 (server half) and task 12 (page half)

- `npm --prefix server test` — full suite, real counts, `sharp` failures listed if not on macOS.
- `./e2e/server/run.zsh` — the whole suite including step 07, PASS or FAIL as it comes.
- Unauthenticated → 401; authenticated without claim → 403 on all five routes; granted → the pre-sprint behaviour.
- The single call without `run` produces a byte-identical response to the pre-sprint upload on the same fixture.
- A run failure on the single call returns the run's code, `retryable`, `requestId` and `analysisId`; the record exists with `status: failed`.
- On the page: Google popup, blocked popup falling back to redirect, email sign-in, reset email, and the not-authorized state — each once, outcome recorded.
- Reviewer dashboard before-and-after screenshot pair, identical.
- `git diff --check`; every document in this folder, in `docs/reference/agent-api/` and operational-07 at or under 50 physical lines.

## Deployment order, when authorized

1. Grant `agent: true` to Pablo's account on TEST with the tool; confirm with `show`.
2. Deploy. 3. Pablo signs in again and sees his existing analyses. 4. `curl` transcript: sign-in, single call, 201, `X-Request-ID`.
5. Logs Explorer: one `request.completed` and one terminal run event for that id. 6. A second, ungranted TEST account receives 403.

## Known gap carried into this sprint

There is still no client-side end-to-end gate. The page half adds sign-in paths to a page checked by hand;
this sprint records that rather than claiming the page is proven.
