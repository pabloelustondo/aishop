# Pattern: rules and reasons

## Speaker notes

This slide collects the design decisions in one place.

A rule is anything the code must keep doing for the design to hold.

Every rule has a reason, and the reason is the one actually recorded.

Do not invent a reason after the fact. If none was recorded, say so, and ask.

Include every frozen number: thresholds, rates, timeouts, sizes.

Say where each number came from and what would justify changing it.

Include the decisions that were rejected, when the rejection was deliberate.

This slide is where a reviewer disagrees most usefully.

Disagreeing with a reason is cheaper than finding the rule in the code.

In the example, each rule and its reason come from an approved document, linked below.

## Fine print

- [No second pass](../../../../ios/AIShop/01-docs/08-low-level-design/session-report.md)
- [Frozen threshold and phone rules](../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
- [macOS as test host](../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-test-host.md)
- [Log written by the pipeline](../../../../ios/AIShop/01-docs/12-observability-insights-and-learning/sprint-001-session-log.md)
