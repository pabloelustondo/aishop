# 032 - Vision Quality and System Reliability Need Different Tests

AI Shop can complete a request while producing a poor visual interpretation.
It can also identify products well while the surrounding application fails.
The test strategy therefore needs two connected but distinct paths.

## Vision-quality experiments
Start with the same original image and a human-verified reference inventory.
Freeze the counting contract, identity depth, prompt, output schema, and reference revision.
Change one factor at a time so the comparison can support a causal conclusion.
Possible factors include model, reasoning setting, context, image detail, and prompt wording.

Record identification errors, missed products, incorrect counts, and invented products.
Score responsible uncertainty separately from confident incorrect identification.
Retain requested and returned model identifiers, usage, latency, cost, and retries.
Include human review time because cheap output can become expensive to correct.
Repeat promising settings and then test them on unseen images.

## System-reliability tests
Verify authentication and the separation of each account's analyses.
Confirm that uploads preserve the original source evidence.
Exercise recorded progress, browser refresh, terminal states, and result retrieval.
Refinement and retry must create traceable runs without erasing earlier evidence.
Failures should retain safe diagnostic references without exposing private input.

Video adds its own requirements.
The system must handle upload interruption, frame extraction, analysis, and playback.
Sampled frames represent one continuous scan rather than independent photographs.
The result should retain frame provenance and avoid counting the same facing twice.
Refresh, task replay, and reconnection should not create duplicate analyses or runs.

## Release boundary
Automated tests, manual QA, and model-quality benchmarks answer different questions.
No single green check proves visual accuracy, deployment, or human acceptance.
A release decision needs evidence from both quality and reliability paths.

## Visual direction
Show two test rails running in parallel toward one evidence-based release decision.
Use distinct colours for visual interpretation and application reliability.
Join the rails only at the final decision gate.
