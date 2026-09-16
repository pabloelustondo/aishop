# Vision Agent API guide

Start with the [developer guide](developer-guide.md): purpose, architecture,
every Vision Agent/Admin endpoint and the tested curl walkthrough.

The original reference chapters were reviewed at `a7f9d3c`; the developer guide
adds the September 15 live results and ACL correction. Older gap notes are snapshots.
These documents describe the current implementation, not a new API proposal.
They are drafts for Claude and Pablo to review; approval is Pablo's commit.

## Read in order

For the comparison baseline, see [existing YOLO application](existing-yolo-application/README.md):
screenshots, catalog inspection and proposed catalog-scoped benchmark rules.

1. [Architecture](01-architecture.md): purpose, user journey and responsibilities.
2. [Endpoint map](02-endpoints.md): public routes and private workers.
3. [Authentication and setup](03-authentication.md): terminal-only setup.
4. [Video reservation](04-video-reservation.md): create a fresh test record.
5. [Storage transfer](05-storage-transfer.md): upload and inspect exact bytes.
6. [Completion and reads](06-completion-and-reads.md): dispatch and observe.
7. [Images and runs](07-images-and-runs.md): JPEG baseline, retry and refinement.
8. [Recovery](08-recovery.md): renewal, cancellation and restart tests.
9. [Admin reads](09-admin-reads.md): filters, detail and source.
10. [Diagnostics and acceptance](10-diagnostics.md): locate the failing stage.
11. [Limits and review gaps](11-limits-and-gaps.md): code limits and open issues.
12. [Architecture implementation](12-architecture-implementation.md): services,
    authentication, storage paths, background workers and deployment regions.

## Scope and test discipline

The environment is TEST: Firebase project `aishop-99d36`.
No production environment is declared. This guide excludes the separate
reviewer `/inspections`, VISTA package-ingest and legacy analysis APIs.

For the saved test scripts, enter Bash and follow the developer guide one step at a time.
Older inline reference recipes use zsh conventions; curl and jq are required.
Stop on an unexpected response. Never carry an invalid ID into later commands.
Use a fresh record first, then separate disposable records for recovery tests.
POST and PUT tests create state; completion/run/restart may incur provider cost.
GET status calls observe state and never initiate provider work.
Do not share passwords, tokens, upload URLs, source bytes or unsanitized logs.
Live execution outcomes are recorded in the linked test collection; untested recipes
must not be treated as successful tests.
