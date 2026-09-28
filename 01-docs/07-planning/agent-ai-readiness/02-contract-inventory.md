# Contract Inventory

What externally exchanged contracts exist in this repository today.

## JSON Schemas

Three, all inside one received bundle:

```text
server/contracts/vista-server-endpoint-agent-handoff-v0.1/schemas/
  manifest-v1.schema.json
  receipt-v1.schema.json
  error-v1.schema.json
```

`vista-manifest-schema.js` compiles `manifest-v1` with Ajv 2020 by
relative path into that bundle. That is the only place a JSON Schema is
executed. `receipt-v1` and `error-v1` are unreferenced by source.

## Everything else is JavaScript

`analysis-contracts.js` holds the three analysis modes as plain objects
with a hand-written `assertValidReport`. VISTA limits, manifest artifact
rules, package identity, and receipt shape are all JavaScript modules
under `server/src/`. None of them is a portable contract a second
runtime could validate against.

## What this means for the handoff

The cloud-architecture document says to "keep existing `server/contracts/`
authoritative and add a versioned agent-ai subpackage there." That
describes a schema registry. What is actually there is an inbox: one
dated bundle VISTA delivered in August, whose `SHA256SUMS.txt` covers
its own contents and which `SOURCE-MAP.md` calls a contextual snapshot.

Adding `agent-ai/` beside it would put authored, evolving contracts
inside a directory whose integrity file asserts it is a frozen delivery.
That is a decision, not a detail — see
[04-open-decisions.md](04-open-decisions.md), D4.

## Gap against the specification

Appendix A of the technical specification names fourteen schemas. One,
`error-v1`, has a same-named counterpart here with unrelated content.
The other thirteen — request, run, evidence package, quality, frame
selection, observation, identity hypothesis, reconciliation graph,
catalog assignment, aggregate result, review task and event, audit
event, sealed manifest — do not exist in any form.
