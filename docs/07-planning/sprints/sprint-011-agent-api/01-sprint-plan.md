# Sprint 011 — Agent API for Authorized Callers

Date: 2026-09-08. Status: PROPOSED; approval requires Pablo's commit.
Drafted by Claude; revised the same day after Pablo corrected the access model ([02](02-credential-decisions.md)).

## Goal and user stories

Pablo explicitly authorizes a Firebase account for the agent; nobody reaches the agent without that act.
An authorized caller obtains a token from a script, POSTs one JPEG and receives the analysed report in the same
response, with a written contract to code against.
An authorized person using the agent page can sign in with email and password, and Google sign-in survives a
browser that blocks popups. Recognition quality stays in the benchmark work.

## What already exists, and is reused

Firebase Auth with verified ID tokens and owner-scoped records (Sprint 004, 008).
The reviewer precedent: a custom claim set by an administrator, enforced by the server on every request
(architecture-03, operational-01). The agent adopts the same shape with its own claim.
The multipart `POST /v1/agent/analyses`, `POST …/{id}/run`, `GET …/{id}`, `GET …` and `GET …/{id}/source` routes.
Email/Password enabled at project level; the Console can create such users directly.

## Scope

1. Authorization: every agent route requires a verified token carrying `agent: true`; otherwise `403 forbidden`.
2. A committed administrator tool that grants or revokes the claim for one account, usable against the emulator.
3. Credential path without a browser: Firebase Identity Toolkit REST sign-in, documented, no server change.
4. Single synchronous call: upload with `run` requested returns the settled record; optional `context`.
5. Agent page: email/password sign-in (no sign-up), reset-email link, Google popup with redirect fallback,
   and a plain "not authorized" state for a signed-in account without the claim.
6. Developer guide under `docs/reference/agent-api/`; operator recipe for granting access under `docs/11-…`.
7. E2E step: grant on the emulator, REST sign-in, single call, then 403 for an unauthorized account and 404 across owners.

## Acceptance

- Unauthenticated: `401`. Authenticated without the claim: `403 forbidden` on every agent route, source included.
- Granting the claim to Pablo's own account is a recorded operational step before deployment; his existing analyses stay reachable.
- A script holding an email, a password and the public web API key reaches an analysed record in two HTTP calls.
- The single call answers 201 with `status: analyzed`; a failed run answers the run's existing error and names the `analysisId`.
- Without `run` the upload route behaves exactly as today; existing tests pass unmodified apart from the new claim in fixtures.
- The page never shows a Firebase error code; the unauthorized state names no administrator contact detail the page does not already have.
- The reviewer dashboard is not edited and renders unchanged. Diagnostics for a single call show one request and one run joined by one reference.

## Boundaries and sequencing

No self-registration for the agent, no API keys, quotas or rate limiting; [02](02-credential-decisions.md) records what the claim does and does not bound.
No 202-and-poll path, queue, second runtime, model selector or `areaScan` change; function options and runtime untouched.
The Node version pin proposed on 2026-09-08 is not in this sprint.
Approve this plan, [02](02-credential-decisions.md) and [03](03-programmatic-contract.md) first; then commit [04](04-sprint-plan-tasks.md) and [05](05-task-rules.md) before code.
Deployment to TEST `aishop-99d36` requires explicit authorization; record commit, the grant step and live evidence.
