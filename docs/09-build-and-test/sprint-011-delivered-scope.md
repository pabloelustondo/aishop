# Sprint 011 — Implementation and Local Validation

Date: 2026-09-11. Branch: `main`. Approved baseline: `8b814a0` (plan, decisions, contract, tasks committed
2026-09-08). Implementation is uncommitted and not deployed. Implemented by Claude in a Linux sandbox on
Pablo's Mac; the emulator suite could not run there (no Firebase CLI reachable) — see Not verified here.

## Delivered behavior (server half, tasks 1–8)

- `forbidden` (403) in the agent error table and the diagnostics allowlist; parity test extended.
- Every agent route requires the verified token's literal `agent: true`; a signed-in account without it
  costs no storage, no record and no run. 401 still precedes 403.
- `server/scripts/agent-access.mjs`: grant/revoke/show by email or uid, `--project` mandatory, emulator-
  aware, merges one claim key, revokes refresh tokens on revoke, prints uid and claims only.
- Upload reader returns `{ file, run, context }`; `run` is the literal "true"; `context` trimmed, ≤ 500
  characters, refused not truncated.
- Single call: with `run`, the handler stores, creates, runs under the same request id and answers 201 with
  the settled record; a failed run answers its own code with `analysisId`. Without `run`, byte-identical.
- E2E step 07: tool grant as a child process, REST sign-in, single call (fixture provider), 403 on every
  route for an ungranted account, 404 across granted owners, 401 after revocation. Steps 04/06 fixtures
  gain the claim through `emulator-auth.mjs`, which now sets claims and refreshes the token.
- Guides `docs/reference/agent-api/01–03` and `operational-07`, each ≤ 50 lines.

## Delivered behavior (page half, tasks 9–11)

- Email/password sign-in, reset email with the same sentence either way, Google popup with redirect fallback
  on popup-blocked/closed, redirect result surfaced; Firebase codes mapped to plain wording (tested).
- A 403 from the list renders the not-authorized state instead of the empty state; no sign-up control.

## Verification

- `npm --prefix server test` on Node 22.23 (Linux arm64): 317 tests, 290 pass, 20 fail, 7 skipped —
  all 20 failures are the pre-existing `sharp` linux-arm64 binary absence (VISTA and `firebase.test.js`),
  unchanged from before this sprint. Agent, admin, router, hosting and page suites: 0 failures.
- RED then GREEN recorded per task: handler 2 → 0, reader 4 → 0, upload 4 → 0 failures.
- `git diff --check` clean. Every document in the sprint folder, the guides and operational-07 ≤ 50 lines.

## Not verified here — Pablo's Mac before staging

- `./e2e/server/run.zsh` including step 07; the "PASS step 07" line and exit code.
- Task 12 by hand at 1440 px and 900 px: Google popup, blocked popup → redirect, email sign-in, reset email,
  not-authorized state; reviewer dashboard screenshot pair; My runs before/after.
- Deployment order in `05-task-rules.md`: grant Pablo first, then deploy.
