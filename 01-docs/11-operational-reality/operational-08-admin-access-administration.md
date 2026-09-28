# Admin access administration (All runs)

The All-runs page and its routes under `/v1/admin/analyses` require the custom claim `admin: true`, set only
by Pablo with the same tool that grants agent access: `server/scripts/agent-access.mjs`, `--role admin`.
Companion to [operational-07](operational-07-agent-access-administration.md), which covers prerequisites.

## What the role does and does not do

- `admin` reads every owner's analyses, attempts, reports and stored images. It cannot upload, run, delete
  or export; there is no POST under `/v1/admin`.
- `admin` does not imply `agent`. An administrator who also uploads holds both claims.
- Owner labels come from the Auth directory at request time (email, else a Google display name, else
  "anonymous" or "unresolved"). No uid appears in a response or a log line.

## Recipe: grant, confirm, revoke

1. `node server/scripts/agent-access.mjs grant person@example.com --role admin --project aishop-99d36`
2. `node server/scripts/agent-access.mjs show person@example.com --project aishop-99d36` — `"admin": true`.
3. The person signs out and back in; the "All runs" link appears on My runs, and `/allruns.html` lists.
4. `node server/scripts/agent-access.mjs revoke person@example.com --role admin --project aishop-99d36`
   removes the role and revokes the account's sessions; an issued token is refused at its next use.

## Before the first deployment of Sprint 012

1. `firebase deploy --only firestore:indexes --project aishop-99d36`, then wait in Console → Firestore →
   Indexes until the four `analyses` collection-group indexes read *Enabled* (minutes). Until then the list
   route answers `503 index_unavailable`, by design, never a 500.
2. Grant `--role admin` to Pablo's account; confirm with `show`.
3. `firebase deploy --only functions,hosting --project aishop-99d36`.
4. Sign in again; open `/allruns.html`; confirm both TEST owners are listed with labels.

## Reading the access log

Logs Explorer, `jsonPayload.service="admin"`: one `access.completed` per request with `actorKey`
(sha256 of the administrator's uid), `operation`, `targetOwnerKey`, `analysisId`, `httpStatus` and
`accessErrorCode`. Filter values, cursors and labels are never logged. To find the administrator behind an
`actorKey`, hash candidate uids locally; the log cannot be reversed on its own.
