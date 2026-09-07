# Sprint 008 — Agent Upload and Analysis

Created: Claude 2026-09-06. Unapproved until Pablo commits it.

## Goal

A person opens a page, uploads a photograph, submits it, and sees it
appear in a list with its recognition result. One new endpoint, one new
page, independent of VISTA.

## Why now

Recognition and facing counts already work — `areaScan` returns named
rows with per-product counts — but the only way to reach them is a
VISTA package uploaded by the phone. There is no way for a person to
hand the server a photograph and get an answer.

## In scope

1. **Upload** — `POST /v1/agent/analyses`, multipart, one still image.
   Stores bytes create-only, creates a record, returns its identifier.
2. **Run** — `POST /v1/agent/analyses/{id}/run` analyses the stored
   image through `areaScan` and stores the report on the record.
3. **List and read** — `GET /v1/agent/analyses` and `.../{id}`. A
   caller sees only their own.
4. **Page** — `dashboard/agent.html`: upload field, submit, and a list
   of submissions with status and result.

Upload and analysis are separate calls so the list has a real status to
show, and so the page stays responsive while a photograph is analysed.

## Out of scope

Video. Queue, worker, and Python. Catalog matching, cross-frame
reconciliation, physical-instance identity, overlays, review workflow,
and production deployment. The reasoning is in
[02-boundaries.md](02-boundaries.md).

## Acceptance

- A person uploads a photograph and sees named products with counts.
- Stored bytes are unchanged and non-overwriting; one caller cannot read
  another's analyses.
- `./e2e/server/run.zsh` extended to cover upload, run, and read.
- All work against the test environment `aishop-99d36`.
