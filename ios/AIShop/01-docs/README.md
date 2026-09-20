# AIShop iPhone App: Vision Documentation

This folder applies the repository's twelve-stage SDLC2 structure to the
iPhone on-device vision experiment.

## Governance

Governance remains canonical for the whole project 
at `docs/00-sdlc2-governance/`. It is not copied
or redefined here. Repository `AGENTS.md` and root governance apply to all work.


## Lifecycle index

1. [Context](01-context-and-domain-analysis/context.md)
2. [Intent](02-intent/intent.md)
3. [System model and use cases](03-system-model-and-use-cases/use-cases.md)
4. [Test strategy](04-benchmarks-test-strategy-and-success-criteria/test-strategy.md)
   and [Sprint 001 fixtures](04-benchmarks-test-strategy-and-success-criteria/sprint-001-fixtures.md)
   and [test host](04-benchmarks-test-strategy-and-success-criteria/sprint-001-test-host.md)
   and [iPhone verification](04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
5. [Proof of concept](05-viable-proof-of-concept/proof-of-concept.md)
6. [Architecture](06-solution-design-and-architecture/high-level-architecture.md)
7. [Roadmap and Sprint 001](07-planning/roadmap.md)
8. [Component contracts](08-specifications-as-code/component-contracts.md)
   and [reports](08-specifications-as-code/session-report.md)
9. [Build and test](09-build-and-test/build-and-test.md)
10. [Review and release](10-review-and-release/review-and-release.md)
11. [Operational reality](11-operational-reality/operational-reality.md)
12. [Observability and learning](12-observability-insights-and-learning/observability.md)
    and [Sprint 001 session log](12-observability-insights-and-learning/sprint-001-session-log.md)

## Current vertical slice

The first experiment searches a prerecorded video stream for one known packaged
product represented by one reference image. It emits an honest candidate signal
while frames are still arriving; it does not claim exact SKU confirmation.
