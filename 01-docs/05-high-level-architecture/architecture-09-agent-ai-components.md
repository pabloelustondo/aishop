# Agent AI — Component Allocation

**Status: PROPOSED.** Companion to
[architecture-08](architecture-08-agent-ai-decision-and-topology.md).

## Node control plane

Authenticates the caller and authorizes inspection scope. Validates
media type, size, declared hash, request schema and idempotency key.
Reserves `run_id` and writes the initial state atomically. Stores or
verifies immutable source evidence and publishes one work message.
Exposes stable submit, status, result, evidence and review interfaces.
Prevents duplicate active runs and enforces retry and dead-letter policy
at the orchestration boundary.

## Python data plane

Fetches evidence by private reference and verifies the hash before
processing. Normalizes orientation and colour, recording deterministic
preprocessing metadata. For video, inspects metadata, selects
deterministic frames, assesses coverage and retains frame timestamps.
Calls recognition and optional OCR through replaceable ports with
bounded retries and budgets. Produces observation hypotheses, localizes
instances, reconciles duplicates across frames, aggregates quantities
and flags uncertainty. Writes immutable predictions, overlay manifests,
metrics and failure evidence — and serves no public traffic.

## Core components

| Component | Responsibility |
| --- | --- |
| Inspection API | existing Node boundary; accepts submissions, returns run resources |
| Run Orchestrator | state machine, idempotency, queue publication, retries, cancellation, budgets |
| Evidence Store | immutable bytes, SHA-256, metadata, derived-artifact namespaces, access policy |
| Recognition Worker | Python shell; coordinates pure pipeline components through ports |
| Media Normalizer / Frame Selector | deterministic preprocessing with versioned parameters |
| Perception Adapter | provider-specific structured-output call; no domain aggregation |
| Observation Reconciler | deduplicates repeated video sightings without merging distinct facings |
| Product Resolver | separates visual identity hypothesis from catalog match; exposes UNKNOWN and candidates |
| Count Aggregator | one row per product key, from unique accepted instance IDs |
| Overlay Renderer | numbered evidence layer tied to observation and instance IDs; never mutates source |
| Result Repository | append-only prediction revisions plus separate attributable human dispositions |
