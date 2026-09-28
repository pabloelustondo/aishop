# Sprint 012 — Decisions

The three questions the proposal said had to be answered before tasks, answered.

## Decision 1 — the admin role is the custom claim `admin: true`, granted only by Pablo

Same mechanism as `agent` and `reviewer`: set with `server/scripts/agent-access.mjs grant <email> --role
admin --project <id>`, checked by the server on every request as the literal `true`. `admin` does not imply
`agent`: an administrator who also uploads holds both claims. No email allowlist exists in code.

## Decision 2 — revocation is the claim plus the session

`revoke … --role admin` removes the key and revokes the account's refresh tokens; the server verifies with
`checkRevoked`, so an ID token already issued is refused at its next use. A newly granted role appears in
the next token only — the page tells the person to sign out and back in.

## Decision 3 — owner identity is resolved from Auth, never stored, never guessed

An owner key is `sha256(uid)`, one-way by design. The resolver lists the project's accounts through the
Admin SDK (bounded: 5 pages of 1,000), hashes each uid, and answers with a label: the account's email; else
its display name marked as Google; else "anonymous" when the account has no provider; else "unresolved"
when no account hashes to that key (deleted account, or a key from another project). The map is cached
in-process for sixty seconds. The uid is never in a response or a log line.

## Decision 4 — listing is a Firestore collection-group query

`agentAnalyses/{ownerKey}/analyses` is queried as a collection group ordered by `createdAt` desc, then
document path desc as the tie-breaker. The cursor encodes that pair, opaque and signed by nothing — it is a
position, not a capability, and every request re-checks the claim. Filters are equality on `ownerKey` and
`status`, range on `createdAt`. Each combination needs a composite index; they are declared in
`firestore.indexes.json`. Without the indexes TEST answers `503 index_unavailable`, never 500.

Alternative considered: enumerating owner documents and merging per-owner queries. Rejected — pagination
across owners becomes unbounded reads, and the owner documents are never actually written.

## Decision 5 — access diagnostics are redacted to references

Each admin request emits one `access.completed` event: `actorKey` (sha256 of the admin's uid), operation,
`targetOwnerKey` and `analysisId` when present, `requestId`, HTTP status and error code. No email, no
label, no filter text, no cursor.

## Deferred

Bulk export, retention, deletion, and any write from the admin page. Not rejected; not this sprint.
