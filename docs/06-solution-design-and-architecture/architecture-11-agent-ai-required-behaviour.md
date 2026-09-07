# Agent AI — Required Product Behaviour

**Status: PROPOSED.** The behavioural constraints the target
architecture exists to satisfy, from the handoff's START HERE document.
Companion to [architecture-08](architecture-08-agent-ai-decision-and-topology.md).

## Required behaviour

- Accept a still image first. Support video through deterministic frame
  sampling and cross-frame reconciliation only after the image path is
  proven.
- Return exactly one aggregate row per distinct product identity, with
  quantity equal to the count of unique physical instances.
- Retain instance-level observations, so every quantity can be audited
  back to numbered boxes or polygons in the source evidence.
- Use stable run, observation, instance, product-hypothesis and
  aggregate identifiers.
- Report UNKNOWN or ranked candidates when identity is not adequately
  supported. Never convert uncertainty into a confident SKU.
- Keep visual recognition separate from catalog matching. A visible
  product may be recognized even when absent from the catalog.
- Keep original media immutable. Annotated overlays are derived
  artifacts. Generated reconstructions are explanatory only and never
  count as evidence.
- Record model, prompt, schema, catalog, preprocessing and software
  versions, plus latency, token usage, estimated cost, warnings and
  failure class.

## Repository integration

- `server/` stays the Node runtime with its existing adapters.
- `recognition-worker/` is added as an independently buildable Python
  service of small, responsibility-focused modules.
- For Increment 0, `server/contracts/` stays authoritative and gains a
  versioned `agent-ai` subpackage; Python models are generated from or
  validated against those schemas. Any later move to a root
  `contracts/` directory needs an approved architecture decision.
- Emulator-backed contract tests at each boundary, plus one
  non-interactive end-to-end composition command with its emulated edges
  explicitly labelled.

## Operational controls

Least-privilege service accounts, Secret Manager, private objects,
retention rules, structured logs, trace propagation, and redaction of
sensitive media and labels. Per-run ceilings on frames, pixels, model
calls, retries, wall time and estimated cost, enforced *before* provider
calls. Metrics: state duration, queue delay, provider latency, token and
call cost, frames selected, objects proposed and accepted, UNKNOWN rate,
duplicate rate, review rate, error class.
