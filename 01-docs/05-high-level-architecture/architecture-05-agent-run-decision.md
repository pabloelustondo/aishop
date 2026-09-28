# AI Shop Agent — Who Fires the Run

Companion to [architecture-04](architecture-04-agent-upload-path.md).

## Purpose

The API separates upload from analysis. Who presses the second call is a
page decision, and it is not one decision but two.

## Decision

The first run fires **automatically** on a successful upload. There is
nothing a person could usefully add before seeing an answer, and one
click is the right cost for the common case.

What follows depends on how that run ended:

- **Failed** — a **Retry** is the same call with the same input. It is
  justified precisely because nothing was produced. Error recovery, not
  a second opinion.
- **Succeeded** — repeating it spends money to get the same rows. Same
  image, same `areaScan` prompt, same answer. A bare re-run on an
  `analyzed` record has no defensible purpose and is not offered.

A second run against a successful record earns its cost only if **the
input differs**. It differs by an optional `context` note the person
supplies: *"this is the CeraVe bay, ignore the top shelf"*. That is a
**Refine**, not a repeat.

## Consequence for the record

A refine means a run is no longer a pure function of the record, so:

- the run endpoint accepts an optional `context` string;
- the record stores **runs as a list**, each with its own input and
  report, rather than a single `report` field;
- `analyzed` reopens to `analyzing`;
- the list shows the latest run and keeps the earlier ones.

## Boundary

A second **image** of the same shelf is several images in one scan, not
a re-run of one analysis. It needs a grouping concept the record does
not have, and is out of scope for Sprint 008.
