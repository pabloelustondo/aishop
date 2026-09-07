# Sprint 007 — Superseded

Created: Claude 2026-09-06. Unapproved until Pablo commits it.

## Status

Superseded by [Sprint 008](../sprint-008-agent-upload/01-sprint-plan.md).
The plan in [01-sprint-plan.md](01-sprint-plan.md) was drafted
2026-08-20 and never approved.

## What was built against it anyway

Its "server analysis" story exists in the server today:
`POST /v1/vista/inspection-packages/{runId}/artifacts/{sha256}/analysis`
in `vista-package-read.js` analyses one stored photograph through
`openai-analyzer.js` and writes the finding onto the run record. The
run list also orders by `receivedAt`.

Not built: the audit-summary parsing of the device's own findings, and
the side-by-side comparison view.

## Disposition

The analyse route stays as it is. It is reached through the VISTA
package path and serves the reviewer looking at a device's run; Sprint
008 builds a separate service for a person uploading a photograph
directly, and does not modify or replace it.

The unbuilt half — device-versus-server comparison — is not carried
into Sprint 008. It remains available as future work if reviewing
device runs becomes a priority again.

## Why this record exists

Code shipped against an unapproved plan. Leaving the folder as a draft
would leave the route looking like work nobody planned, and leaving the
plan open would imply the comparison view is still scheduled. Neither
is true.
