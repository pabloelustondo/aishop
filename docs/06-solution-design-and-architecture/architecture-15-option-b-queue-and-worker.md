# Option B — Queue and Worker

**Status: DEFERRED.** Pablo selected Option A in
[14](architecture-14-option-a-provider-background-mode.md) and may analyze this
alternative in the future.

## The shape

`run` enqueues a message and returns `analyzing`. A private worker calls the
provider and settles the record. The worker is not behind Hosting and owns its
runtime envelope. Provider application-state storage is unnecessary, although
ordinary provider processing and abuse-monitoring rules still apply.

This is the topology the handoff proposed and
[08](architecture-08-agent-ai-decision-and-topology.md) describes. Pub/Sub
versus Cloud Tasks remains open in
[12](architecture-12-agent-ai-open-decisions.md).

## Additional machinery

- a worker function with its own composition and deploy target;
- a queue created outside the repository;
- service-account, enqueue and worker-invocation permissions;
- retry, dead-letter and operational alerting policies;
- idempotency against duplicate delivery and duplicate provider billing;
- an end-to-end path that keeps the queue behavior continuously proven.

## When to reconsider

Analyze Option B if evidence shows that provider-stored response state is
contractually unacceptable, client-driven collection is insufficient, or
video and sustained workloads need independent compute and retry control.

Adoption would require its own approved architecture decision, Sprint Plan,
component-scoped tasks, infrastructure authorization and cost review.
