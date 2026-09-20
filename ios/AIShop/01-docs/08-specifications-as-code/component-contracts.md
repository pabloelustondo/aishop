# AIShop iPhone App: Component Contracts

These conceptual contracts become Swift protocols and value types only after the
Sprint 001 plan and a separate tasks document are approved.

## `FrameStream`

- Produces timestamped frames incrementally.
- Declares deterministic or timestamp-paced delivery mode.
- Supports cancellation and reports dropped frames.
- Does not expose camera-specific behavior to consumers.

## `TargetDescriptor`

- Stable product ID and display name.
- Reference image identity and generated feature representation.
- Optional catalog metadata that does not affect Sprint 001 correctness.

## `CandidateProductSignal`

- `productID`, `videoTimestamp`, `similarity`, and `bestFrameID`.
- `consecutiveSupportingFrames`, `processingLatency`, and evidence state.
- Evidence state is provisional; Sprint 001 cannot emit `confirmed`.

## `CandidateEpisodeAggregator`

- Groups temporally adjacent supporting signals for the same target.
- Preserves the strongest signal and interval.
- Produces deterministic output for an identical ordered frame sequence.

Concrete thresholds, timestamp tolerances, and error types belong in the later
approved Sprint Plan Tasks and executable tests.
