# AI Shop roadmap and long-term backlog

Status: proposal for Pablo's review; recorded 2026-09-15.
This roadmap orders desired outcomes, not approved implementation tasks.
Dates, effort and sprint assignments require scope review; none are committed here.

## Priority order

| Order | Workstream | Outcome |
|---|---|---|
| Now | Complete testing and benchmark against the current YOLO application | Evidence-backed baseline and comparison before expanding features |
| Next | Capture YOLO scanner findings | Team can enter/import findings linked to the same evidence as AI Shop |
| Then | Comparison statistics | Pages explain count and identification differences across systems |
| Then | Analysis cost visibility | Per-run and aggregate cost estimates with usage and retry context |
| Then | Model and parameter selection | Controlled experiments with recorded settings and cost safeguards |
| Then | Catalog integration | Match visual findings to known products with reviewable ambiguity |
| Scheduling open | Numbered visual findings | One circle per product group, linked to its visible count in the findings table |
| Scheduling open | User/role administration | Authorized administrators manage application access safely |

The five sequential feature workstreams were discussed as candidate Sprints 015–019.
Those numbers are provisional: immediate testing/benchmark scope may change scheduling.
Do not create or rename sprint packages solely from this table.

## Immediate priority

Follow [testing and YOLO benchmark](01-immediate-testing-and-benchmark.md).
Finish the current API/browser validation, resolve or explicitly defer open defects,
and compare AI Shop with the current YOLO-based application on shared evidence.
The first comparison can be manual; do not wait for comparison-entry or stats features.
Benchmark findings should inform later feature scope rather than assume a winner.

## Planning gates

See [feature workstreams](02-feature-workstreams.md) for boundaries and dependencies.
See [numbered visual findings](03-numbered-visual-findings.md) for the annotation candidate.
Choose a workstream, resolve its open questions, then create the dedicated branch
from the approved integration branch before drafting its Sprint Plan.
Pablo commits the Plan and then the separate Tasks document before implementation.
Roadmap approval alone does not authorize deployments, new spending or data changes.
Current Sprint 014 closure remains a separate decision backed by test evidence.

## References

- [Guided API results](../../10-review-and-release/agent-vision-api-test/README.md)
- [Developer API guide](../../guides/vision-agent-api/developer-guide.md)
- [Role administration proposal](../proposals/user-role-administration.md)
