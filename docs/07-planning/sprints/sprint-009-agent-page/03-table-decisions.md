# Sprint 009 — Table and Detail Decisions

Companion to [02-layout-decisions.md](02-layout-decisions.md). What is
shown for one analysis, once it has the width.

## Three columns: product, facings, confidence

Confidence and visible evidence are already in every `areaScan` row; the
page renders name and count and throws the rest away.

## The confidence badge carries its own evidence

Evidence was a fourth column, then a marker column of its own. Both were
wrong: a column existing only to hold a hover target earns nothing. The
badge already answers *how sure*, so it answers *why* too, on hover or
keyboard focus; a dotted underline marks it as having more behind it.

The badge itself stays visible rather than hiding behind that hover: it
is the scannable signal — *show me the Low rows* — and burying it would
mean hovering forty rows to find the weak ones.

`title` is kept only as a fallback: bare `title` is delayed, unstyleable
and read unreliably by screen readers. Touch has no hover, so the build
needs tap-to-open — a task detail, not a design change. Worth
revisiting: evidence inline on Low rows only, hover for the rest.

## Uncertain items are listed, not counted

"5 item(s) the model could not identify" gives a person nothing to act
on — the first-run screenshot proves it. Each description and reason is
in the report already, and both are shown.

## Runs are listed with their notes

The record returns every run with the context that produced it, so a
refined answer reads beside the instruction that asked for it — what
[architecture-05](../../../06-solution-design-and-architecture/architecture-05-agent-run-decision.md)
claimed, and the current page does not do.

Model, duration, byte size and dimensions are shown where the record
holds them. Latency and cost are not stored today; that gap belongs to
[architecture-11](../../../06-solution-design-and-architecture/architecture-11-agent-ai-required-behaviour.md),
not to this sprint.

## Placeholder data in the mockup

Product names and facing counts are the real 2026-09-07 result.
Confidence, evidence text, uncertain-item reasons and run 2 are
invented — that run's values were never captured. The mockup says so at
the top of the page.
