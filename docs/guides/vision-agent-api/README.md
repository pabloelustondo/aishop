# Vision Agent API guide

Source reviewed: commit `a7f9d3c`, 2026-09-15.
These documents describe the current implementation, not a new API proposal.
They are drafts for Claude and Pablo to review; approval is Pablo's commit.

## Read in order

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

Run shell blocks in order in the same macOS zsh terminal; curl and jq are required.
Stop on an unexpected response. Never carry an invalid ID into later commands.
Use a fresh record first, then separate disposable records for recovery tests.
POST and PUT tests create state; completion/run/restart may incur provider cost.
GET status calls observe state and never initiate provider work.
Do not share passwords, tokens, upload URLs, source bytes or unsanitized logs.
The commands are instructions: they were not executed against live data here.
