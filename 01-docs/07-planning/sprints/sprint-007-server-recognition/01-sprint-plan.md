# Sprint 007 — Server Recognition and Reviewer Comparison

Created: CLAUDE 2026-08-20
Approved:

## Goal

Make the server do something with the VISTA packages it stores: run GPT image
recognition on their evidence, and show the device's findings beside the
server's in a form a reviewer can read.

## Why now

Thirteen packages are stored with `analysisStatus: "notRequested"` and no code
path has ever analysed one. Five field runs on 2026-08-19 produced device
findings that exist only inside a 535 KB audit artifact nobody reads. The
dashboard lists runs by identifier in effectively random order, as raw JSON.

## In scope

1. **Audit summary** — parse the `audit/events` artifact into a stored device
   summary: named rows, facing counts, coverage, and pipeline health.
2. **Server analysis** — analyse package evidence through the existing OpenAI
   adapter, reusing the `areaScan` contract shape, stored per run.
3. **Read API** — expose both summaries; order runs by `receivedAt` descending.
4. **Dashboard** — a comparison view: evidence images, device findings and
   server findings side by side, as prose and tables rather than JSON.

## Out of scope

The VISTA receipt contract is `const`-locked on `status` and `analysisStatus`
with `additionalProperties: false`; it is not modified, so nothing here reaches
the phone. No device-side change. No production environment.

## Decisions carried into Tasks

- Analysis runs on demand from the dashboard, never during ingest: that path
  has a qualified memory envelope and a 30 s HTTP ceiling.
- The first increment analyses the global still only.
- Ordering uses `receivedAt`, an ISO-8601 string that sorts correctly; a
  collection-group query needs its index scope declared or it fails closed.

## Acceptance

- A stored run shows device and server findings side by side, readable.
- The run list is newest first and identifies runs by time, not by hash.
- `./e2e/server/run.zsh` extended to cover the analysis path, and passing.
- All work against the test environment `aishop-99d36`.
