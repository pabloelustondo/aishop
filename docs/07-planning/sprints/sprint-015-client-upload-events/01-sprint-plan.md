# Sprint 015 — Client Upload Events

Status: Proposed; approval is Pablo's commit. Drafted 2026-09-14.

## Problem

Video bytes travel from the browser straight to Cloud Storage; the server
sees a reservation, then nothing. When Storage rejected a chunk with 400
on 2026-09-14, server logs were accurate and useless, the page had discarded
the status, and the cause was guessed three times before it was read once.
Diagnostics stop at the server's edge; the failing leg is the one they miss.

## Goal

A failed upload has a story in the same place as everything else: the page
reports what Storage told it, and a person can read it in All runs.

## Scope

1. **Event route** — `POST /v1/agent/analyses/{analysisId}/events`,
   owner-scoped under the agent claim; the record must belong to the caller.
2. **Allowlisted payload, nothing free-text** — `kind` from a fixed set
   (chunk completed, chunk rejected, inspect rejected, session renewed,
   session released), `chunkIndex`, `offset`, `byteLength`, `storageStatus`,
   `storageCode` from the client's own fixed set, `clientRequestId`,
   `occurredAt`. Any other field or type is `400`.
3. **Bounded** — body under 2 KiB, at most 100 events per analysis, and a
   per-owner rate; beyond any, `429`. All three are configuration.
4. **Stored on the record** as client diagnostics beside server ones,
   tagged with the attempt they belong to.
5. **Page reports every chunk outcome and rejection**, fire-and-forget;
   reporting never delays, blocks, or fails the transfer.
6. **`attemptId` joins the diagnostics allowlist** and every processor and
   collector event, so a stale-attempt rejection names the attempt.
7. **All runs** renders client events in the attempt's timeline.

## Out of scope

A general logging endpoint, free text, console capture, alerting, a
stuck-record scheduler, and any change to the upload protocol itself.

## Acceptance

- A rejected chunk in TEST shows status, reason code and offset in All runs.
- A payload with an extra field, wrong type, or free text is refused.
- The 101st event for one analysis is refused; the upload is unaffected.
- Reporting failure (network, 429, 500) never changes upload behaviour;
  cross-owner posting is refused, and an admin can read but never post.
- `./e2e/server/run.zsh` posts events and reads them back; the diagnostics
  parity test covers `attemptId` and the new event kinds.
