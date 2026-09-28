# Agent AI — Open Decisions

**Status: ACTIVE.** Cloud Tasks is selected for server-owned analysis progression
by [15](architecture-15-option-b-queue-and-worker.md). Other decisions remain open.

## Closed here

- Cloud Tasks, not Pub/Sub, owns per-analysis delayed dispatch, bounded retries
  and rate control.
- The current Node/Firebase runtime remains the public control plane and worker;
  no Python or Cloud Run service is introduced for still-image analysis.
- Firestore is authoritative for analysis state. A browser may observe state but
  never starts, retrieves, retries, settles or deletes provider work.

## Still open

- Functions versus Cloud Run after sustained workload or video benchmarks.
- Authoritative product identity: SKU/GTIN, variant, family or mixed confidence.
- Facing policy for occlusion, multipacks, stacking, reflections and partials.
- Provider portfolio, confidence calibration and human-review threshold.
- Production retention, privacy, residency, cost ceilings and alerting.

Pablo's readiness decisions in
[agent-ai-readiness/04](../07-planning/agent-ai-readiness/04-open-decisions.md)
supersede this list where they overlap.
