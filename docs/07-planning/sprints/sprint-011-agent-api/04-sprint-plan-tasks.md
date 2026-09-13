# Sprint 011 — Sprint Plan Tasks

Created: Claude 2026-09-08, revised the same day for the explicit-authorization model. Drafted alongside
[01](01-sprint-plan.md), itself uncommitted. Coding begins only after Pablo commits the plan **and** this
document. Rules in [05](05-task-rules.md).

## Fixed decisions

- Authorization is the custom claim `agent: true`, granted only by Pablo ([02](02-credential-decisions.md)).
- The single call is two optional multipart fields on the existing upload route ([03](03-programmatic-contract.md)); no new route.
- The reviewer dashboard, `analysis-contracts.js`, the `areaScan` schema and every `vista-*` module are untouched.

## Ordered tasks — server half

1. **Agent API error table — `forbidden`.** `server/src/agent-api-error.js`. `forbidden: [403, "The account is not authorized for the agent.", false]`.
2. **Diagnostics allowlist — `forbidden`.** `server/src/agent-diagnostics.js`. The parity test with `AGENT_API_ERROR_CODES` is what fails first.
3. **Agent API handler — require the claim.** `server/src/agent-api-handler.js`. `ownerKeyFor` throws `forbidden` unless the verified token carries `agent === true`; the owner key derivation is unchanged. Fixtures gain the claim.
4. **Administrator tool — grant and revoke.** New `server/scripts/agent-access.mjs`. Admin SDK; `grant <email|uid>`, `revoke <email|uid>`, `show <email|uid>`; honours `FIREBASE_AUTH_EMULATOR_HOST`; prints the uid and claims, never a token. Its own test runs against the Auth emulator.
5. **Upload request reader — optional fields.** `server/src/agent-upload-request.js`. Returns `{ file, run, context }`; `run` true only for the literal `true`; `context` trimmed, `null` when absent, `context_invalid` beyond 500 characters.
6. **Agent API handler — analyse on upload.** `server/src/agent-api-handler.js`. With `run`, store, create, then `runner.run` under the same diagnostic context; 201 with the settled record. A run failure converts as today with `analysisId` added to the body. Without `run`, the existing branch runs byte-for-byte.
7. **E2E step 07 — authorized scripted caller.** `e2e/server/step-07-agent-programmatic.mjs`, one line in `run.zsh`. Creates two email/password users on the Auth emulator; grants one with task 4's tool; REST sign-in; single call with `run=true` and a context through the fixture transport → 201 `analyzed`; the ungranted user → 403 on list, record and source; a third granted user → 404 on the first user's record.
8. **Guides.** `docs/reference/agent-api/01-getting-a-token.md`, `02-analysing-one-photograph.md`, `03-errors-and-limits.md`; `docs/11-operational-reality/operational-07-agent-access-administration.md` (the grant recipe, including granting Pablo before deployment). Each ≤ 50 lines; transcripts from task 7's passing run.

## Ordered tasks — page half (separable into Sprint 012 without affecting the server half)

9. **Page script — sign-in paths and the unauthorized state.** `dashboard/scripts/agent.js`. Email/password sign-in and reset email; popup-blocked or popup-closed → `signInWithRedirect`, `getRedirectResult` on load; a `403` from list renders the not-authorized state instead of the empty state. Firebase codes mapped to plain wording.
10. **Page markup — sign-in card.** `dashboard/agent.html`. Email, password, "Sign in", "Forgot password", the Google button; no "Create account". A not-authorized block.
11. **Page stylesheet — sign-in card.** `dashboard/styles/agent.css`. Form styles for task 10; nothing else moves.
12. **Verification pass.** No component change. Suite counts, whole emulator suite, the sign-in paths by hand at 1440 px and 900 px, reviewer dashboard against `main`.

## Sequencing

1 → 2 → 3: the code exists, is allowed in diagnostics, then is thrown. 4 before 7; 5 before 6; 6 before 7; 7 before 8.
3 changes what every existing test's fixture token must carry — land it before 5 and 6 so their tests are written against the final gate.
