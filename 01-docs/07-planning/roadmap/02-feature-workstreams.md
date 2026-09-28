# Roadmap feature workstreams

Status: proposed backlog; sprint numbers, effort and acceptance details unassigned.

## Capture YOLO findings — candidate 015

Let the team enter or import the current scanner's findings for shared evidence.
Preserve native YOLO output, AI Shop output, provenance and human review separately.
Choose the smallest adapter after inspecting a real scanner output sample.
Do not assume manual entry, JSON import or live API integration before that review.

## Comparison statistics — candidate 016

Show per-case and aggregate differences in counts and product identification.
Distinguish system agreement from accuracy against a reviewed reference.
Retain sample size, filters, model/settings and uncertainty behind every statistic.
Depends on comparable linked findings and explicit label/count mapping rules.

## Analysis cost visibility — candidate 017

Show model, token usage and estimated cost per run, including failed/retried work.
Aggregate by selected period and user where authorized.
Version price assumptions; separate model estimates, infrastructure and actual billing.
Missing usage is unknown, not zero. Inspect available diagnostics before adding collection.

## Model and parameter selection — candidate 018

Allow server-approved model/settings choices and retain exact choices per run.
Support controlled comparison on the same evidence, with validation and cost safeguards.
Provider credentials remain server-side. Unsupported settings must fail clearly.
Clarify whether this means other OpenAI models, other providers or both.
Cost visibility should precede broad experimentation.

## Catalog integration — candidate 019

Connect visual findings to known catalog products and stable identifiers.
Return candidate matches and uncertainty; support manual resolution of ambiguity.
Keep visual observations distinct from catalog-enriched information.
First choose catalog source, access contract, identifiers, update rules and licensing.

## User/role administration — scheduling open

Provide safe user lookup and independent Agent/Admin grants and revocations.
Require server authorization, audit history and lockout/concurrency safeguards.
See the [existing proposal](../proposals/user-role-administration.md).
This manages application access, not Google Cloud IAM privileges.
