# Pattern: a data contract

## Speaker notes

A data contract says what a record means, field by field, and who depends on it.

Give one to every record that crosses a boundary: a log line, a report, a file, an API payload.

The third column is the important one. It shows what breaks if the field changes.

State units. State direction, such as "lower is closer".

State what is stored and what is derived.

Say what a field is not. In the example, a distance is not an accuracy or a probability.

If the record is versioned, say how a reader detects the version.

Group small related records on one slide. Give a large schema its own slide per record family.

A field table is the right visual here. A diagram would add nothing.

In the example, the frame ID is identical on the Mac and the phone.

That single property is what makes comparing the two hosts frame by frame possible.

## Fine print

- [Score type](../../../../ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift)
- [Session log contract](../../../../ios/AIShop/01-docs/12-observability-insights-and-learning/sprint-001-session-log.md)
- [A real score log](../../../09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-positive/session.jsonl)
