# Sprint 008 — Boundaries

Why this sprint is shaped the way it is. Companion to
[01-sprint-plan.md](01-sprint-plan.md).

## Independence from VISTA

Pablo's instruction: keep this independent of previous VISTA work and
reuse only the server structure.

So this service shares the server's shape and nothing else. Its own
route namespace, its own Firestore collection, its own Storage prefix.
It reads no manifest, verifies no audit chain, and touches no `vista-*`
module or record.

Reused: Firebase token verification, the router and handler shape,
create-only object writes, `http-json`, `errors`, `openai-analyzer`,
and `analysis-contracts`.

Not reused, deliberately: the package manifest and its schema, the
audit chain, the sealed-receipt contract, the multipart artifact-set
validator, and the reviewer allowlist. Each exists to make a device's
sealed run auditable. A person uploading a photograph from a browser
has no run to seal, so importing any of it would add ceremony without
adding a guarantee.

## Deviation from the Agent AI handoff

The handoff specifies an asynchronous Python worker behind a queue, and
an evidence contract bound to a VISTA inspection manifest. Neither is
built here.

Evidence arrives by direct upload, so there is no manifest to bind to;
identity is the uploader plus the content hash. And with stills and one
person, analysis fits inside the function's existing 120 s ceiling, so a
queue and a second runtime would be infrastructure ahead of need.

Video is what changes that calculation: frame extraction and cross-frame
reconciliation are slow enough to need asynchronous execution and are
where a Python toolchain earns its place. The handoff's architecture is
revisited then, on measured workload rather than on proposal.

## What this sprint does not claim

That the result is correct. `areaScan` is open-world: a name in a report
is what a model read off a package, not a match against a catalog and
not a reviewed fact.
