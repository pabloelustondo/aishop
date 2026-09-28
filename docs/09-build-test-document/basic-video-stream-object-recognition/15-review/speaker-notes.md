# What the implementation establishes

## Speaker notes

The strongest result is a testable streaming pipeline with real Vision and a controlled source edge.

The same package can run without the application shell, which made native integration testing possible.

Bounded replay avoids accumulating stale inference work when the consumer slows down.

A frozen scoring profile separates calibration from regression tests.

Episode logic prevents every supporting frame from becoming a duplicate report item.

Structured evidence lets us reproduce report data and inspect failures without a second video pass.

The Debug startup path preserves an offline way to exercise the production package.

The tests also preserve boundaries: scores are not probabilities, and synthetic calibration inputs are not phone evidence.

We have not established general recognition accuracy, dense-shelf performance, latency on iPhone, thermals, battery use, or camera behavior.

The missing distractor fixture is a measurement gap.

The physical demonstration and real exported-log comparison remain required.

The source changes remain uncommitted proposals. The sprint is not accepted.

At this review point, check the feature scope and the explanation before extending the design.

## Code and evidence

- [Integration checks](../../../../ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift)
- [Required Mac checks](../../../../e2e/ios/required-tests.txt)
- [Acceptance gate](../../../../ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan-acceptance.md)
- [Phone acceptance rules](../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
