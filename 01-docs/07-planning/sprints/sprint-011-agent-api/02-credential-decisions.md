# Sprint 011 — Access and Credential Decisions

Pablo's decisions of 2026-09-08, with the consequences each one carries. Companion to [01](01-sprint-plan.md).

## Decision 1 — access is granted explicitly by Pablo in Firebase; no self-service

An account existing is not the gate: Google sign-in on the page creates a Firebase user for anyone.
The gate is a custom claim, `agent: true`, on the account, exactly as `reviewer: true` gates the review queue.
The server requires it on every agent route; a signed-in account without it receives `403 forbidden`.

Consequences accepted:

- The Console cannot set custom claims (operational-01), so this sprint commits a small Admin SDK tool,
  run locally by Pablo with his own credentials, that grants or revokes the claim for one email or uid.
- A newly granted claim appears in the next ID token, not the current one: a signed-in user refreshes or signs in again.
- Pablo's own account must be granted before the new server code is deployed, or his page goes dark.
- The claim bounds *who* may call, not *how much*. Spend under the project's OpenAI key is bounded by the number of
  accounts Pablo grants and by `maxInstances: 1`; that is acceptable while every caller is personally known.

Alternative considered: disabling sign-up project-wide in Auth settings. Rejected — it would also disable customer
self-registration that architecture-03 promises the iPhone app, and it still would not distinguish agent callers.

## Decision 2 — a script obtains a token through Firebase's REST sign-in

Pablo creates the account in the Console as Email/Password (or grants an existing Google account), then grants the claim.
`POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={webApiKey}` returns an `idToken`
(one hour) and a `refreshToken`; `POST https://securetoken.googleapis.com/v1/token?key={webApiKey}` renews it.
The token is sent as `Authorization: Bearer` exactly as the page sends it.

- The web API key is public by design; it identifies the project and authorises nothing.
- Email-enumeration protection stays on. Sign-in attempts are rate-limited by Firebase, not by our code.
- Revocation is the claim, not the password: revoke the claim, then revoke refresh tokens, as operational-01 does for reviewers.

## Decision 3 — one synchronous POST returns the report

Two optional multipart fields, `run` and `context`, on the existing upload route. Runs settle in 6–10 s under a
120 s timeout. If runs lengthen, a 202-and-poll path is a new sprint. Concurrent callers serialise.

## Decision 4 — the page gets email/password sign-in and a redirect fallback

Sign-in and the reset email only; no "create account" control, since accounts are created by Pablo.
`signInWithPopup` failing with a popup-blocked or popup-closed code falls back to `signInWithRedirect`.
A signed-in account without the claim sees one sentence saying the account is not authorized for the agent.

## Deferred

Per-user API keys and per-owner quotas: the right shape once callers are not personally known. Not rejected.
