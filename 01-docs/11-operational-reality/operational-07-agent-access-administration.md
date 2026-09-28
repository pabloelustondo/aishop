# Agent access administration

Access to the agent API and page is the custom claim `agent: true` on a Firebase account, set only by
Pablo with the committed tool `server/scripts/agent-access.mjs`. An account existing — Google sign-in on
the page creates one for anyone — grants nothing. Companion to [operational-01](operational-01-firebase-reviewer-administration.md).

## Prerequisites (once)

- `gcloud auth application-default login` with an account that is an Owner or Firebase Admin of the project.
- `npm --prefix server ci` so `firebase-admin` is installed.

## Recipe: authorize an account

1. Create the account in the Firebase Console → Authentication → Users → Add user (Email/Password), or
   have the person sign in once with Google on the agent page.
2. `node server/scripts/agent-access.mjs grant person@example.com --project aishop-99d36`
3. Read the printed `uid` and `claims`; `"agent": true` is the fact that matters.
4. Have them sign in again (page) or call sign-in again (script). The claim is in the next token only.
5. `node server/scripts/agent-access.mjs show person@example.com --project aishop-99d36` confirms.

## Recipe: revoke

`node server/scripts/agent-access.mjs revoke person@example.com --project aishop-99d36`
removes the claim and revokes the account's refresh tokens; an ID token already issued is refused at its
next use because the server verifies with `checkRevoked`. The account itself remains.

## Before deploying Sprint 011

Grant Pablo's own account first, then deploy. Deploying first turns his page dark until the grant lands.

## Rules

- `--project` is mandatory; the tool refuses to run without it. Use `demo-aishop-e2e` only with
  `FIREBASE_AUTH_EMULATOR_HOST` set.
- The tool prints uid and claims, never a token or password. Do not paste its output into chat with a
  real email visible if the transcript will be committed.
- The `--role admin` variant is Sprint 012's All-runs authorization; it grants nothing on the agent routes.
- Record each grant and revoke with date and uid in the deployment note of the sprint that needed it.
