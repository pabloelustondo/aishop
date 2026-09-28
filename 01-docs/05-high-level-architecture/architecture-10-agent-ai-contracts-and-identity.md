# Agent AI — Contracts, Identity and State

**Status: PROPOSED.** Companion to
[architecture-08](architecture-08-agent-ai-decision-and-topology.md).

## Shared contract

Every queue message and persisted result validates against versioned
JSON Schema. Required envelope fields: `schema_version`, `run_id`,
`inspection_id`, `evidence_id`, `evidence_sha256`, `media_type`,
`requested_pipeline_version`, `idempotency_key`, `created_at`,
`trace_id`.

Required result layers: run metadata; source evidence; frames;
observations; physical instances; product hypotheses; catalog matches;
aggregated products; artifacts; warnings; metrics; failure when it
applies.

## Identity and counting invariant

- `quantity(product_key) = count(distinct accepted instance_id linked to
  product_key)`.
- One aggregate row per `product_key`. Brand-only or family-only
  evidence must never silently become a SKU key.
- `observation_id` — what a model saw in one frame. `instance_id` — one
  physical object or facing, across observations. `product_key` — the
  chosen aggregation level.

The sharpest difference from what runs today: the current `areaScan`
contract returns a name and a count with no instance layer beneath it,
so no quantity is auditable back to a located object.

## State machine

`RECEIVED → VALIDATED → QUEUED → PROCESSING → SUCCEEDED | PARTIAL |
NEEDS_REVIEW | FAILED | CANCELLED`

Transitions are compare-and-set and append an event carrying actor,
timestamp, prior and new state, reason, attempt and trace ID. Replayed
queue messages must be harmless.

## Storage model

- Cloud Storage — `/inspections/{inspection_id}/evidence/{evidence_id}/original`
  and `/runs/{run_id}/artifacts/{artifact_type}/{version}`.
- Firestore — `inspections`, `evidence`, `recognitionRuns`,
  `recognitionRunEvents`, `predictionRevisions`, `reviewDispositions`, `catalogVersions`.
- Original evidence and the initial prediction are never overwritten;
  corrections are separate revisions or dispositions, with author and
  server timestamp.
