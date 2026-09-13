# Agent AI — Open Decisions and Distance From Today

**Status: PROPOSED.** Closes
[architecture-08](architecture-08-agent-ai-decision-and-topology.md).

## Open architecture decisions

Named in the handoff as unresolved:

- Firebase Functions generation and runtime versus Cloud Run, after a
  dependency and workload benchmark.
- Pub/Sub versus Cloud Tasks, on delivery, scheduling, rate control and
  retry needs.
- Authoritative product identity level: SKU/GTIN, variant, product
  family, or mixed confidence-based levels.
- Facing and count policy for occlusion, multipacks, stacked items,
  reflections and partially visible items.
- Provider and model portfolio, confidence calibration, human-review threshold, media retention, cost ceiling.

Pablo's own blocking decisions — including whether Python belongs in
Increment 0 at all — are in
[agent-ai-readiness/04](../07-planning/agent-ai-readiness/04-open-decisions.md),
which supersedes this list where they overlap: it was written against
the repository, this one against the proposal.

## Distance from what is built

Sprint 008 deliberately built none of this, and
[its boundaries document](../07-planning/sprints/sprint-008-agent-upload/02-boundaries.md)
records why: with stills and one person, analysis fits inside the
function's 120 s ceiling, so a queue and a second runtime would be
infrastructure ahead of need. Evidence arrives by direct upload, so no
manifest exists to bind to.

Concretely, the delivered agent upload path has no queue, no worker, no
Python, no instance layer beneath its counts, no state machine past four
statuses, and no per-run cost or latency metrics. It is a synchronous
Node path that returns names and counts.

Shared: immutable create-only evidence, a content hash, owner-scoped
storage, a typed failure on every path, and a refusal to turn
uncertainty into a confident answer.

## When this becomes live architecture

Video is the trigger the boundaries document names. Frame extraction and
cross-frame reconciliation are slow enough to need asynchronous
execution and are where a Python toolchain earns its place. Until then
this folder describes a target, and the architecture in force is
[architecture-04](architecture-04-agent-upload-path.md).
