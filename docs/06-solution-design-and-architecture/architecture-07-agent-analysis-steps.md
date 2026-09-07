# AI Shop Agent — Analysis, Step by Step

Companion to [architecture-04](architecture-04-agent-upload-path.md).

## 4 — Something asks for the analysis

The server never analyses on upload. Running is its own call,
`POST /v1/agent/analyses/{id}/run`, which gives the list a real status
to show and keeps the page responsive while a photograph is read.

Who presses it is settled in
[architecture-05](architecture-05-agent-run-decision.md).

## 5 — The prompt and the image go to GPT

The record is marked `analyzing` *before* the image is read and before
the provider is called, so a run that dies mid-flight is visible as
started rather than indistinguishable from one never attempted.

The prompt already exists: the `areaScan` contract that tells the model
to count facings rather than stacked depth, to keep uncertain items
separate, and to invent nothing. A refine's note is appended after that
instruction, never in place of it. The answer comes back against a fixed
schema, so a malformed reply is a typed failure, not a surprise.

Every ending is recorded. Success stores the report; a timeout, a
provider error, or an unreadable file each write their own reason. A run
never simply vanishes.

| File | Responsibility |
| --- | --- |
| `agent-analysis-runner.js` | orders the steps, records every outcome |
| `analysis-contracts.js` | the `areaScan` instruction and schema, unchanged |
| `openai-analyzer.js` | makes the call; takes an optional note |
| `agent-analysis-store.js` | `analyzed` with the report, or `failed` with a reason |

## 6 — The result is shown

One row per product, each with the number of facings visible. The list
reads only the caller's own records: they are nested under the owner
key, so a query cannot reach anyone else's even by accident.

| File | Responsibility |
| --- | --- |
| `agent-api-handler.js` | serves the read and the list |
| `dashboard/scripts/agent.js` | renders the rows, counts, and controls |
