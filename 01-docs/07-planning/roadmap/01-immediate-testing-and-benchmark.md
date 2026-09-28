# Immediate priority — finish testing and benchmark against YOLO

Status: proposed workstream; not a Sprint Plan or implementation authorization.

## Goal

Establish a reproducible AI Shop baseline and compare it with the current
YOLO-based application before selecting the next product increments.

## Complete current validation

- Diagnose the original-video source endpoint's recorded HTTP 500 and verify playback.
- Verify stored-original checksums after retrieval works.
- Complete selected authorization/isolation, upload-resume, cancellation and restart tests.
- Retest hosted browser behavior, including progress and refresh recovery.
- Record each test as a small script, explanation, expected and actual result.
- Preserve failed attempts and successful retries; explicitly decide remaining defects.
- Obtain human review of report content separately from transport/processing success.

## Initial benchmark, without new comparison UI

- Collect a small agreed set of representative shelf images and videos from the team.
- Keep immutable originals, identifiers and checksums linking each system's outputs.
- Run comparable evidence through AI Shop and the current YOLO application.
- If inputs differ (sampled frames versus live scan), record that difference explicitly.
- Preserve native results; align product labels and count meaning before comparing.
- Create human-reviewed reference counts and identities for the selected examples.
- Treat YOLO and AI Shop outputs as predictions, not reference truth.
- Count visible facings separately from hidden stock; flag occlusion and uncertain identity.
- Check repeated video views for duplicate counts.
- Record application/model versions, parameters, sampling, duration and available usage.
- Report count error, identification errors, failures and review effort with sample size.
- Define matching rules before precision/recall; show agreement only without ground truth.
- Change one variable at a time; record repeats to expose output variability.

## Deliverables and decisions

A shared case inventory, original outputs, reviewed references, comparison table,
known limitations and recommended next actions. No assumed accuracy target or winner.
Agree acceptance thresholds before qualification; timing/cost must state measurement limits.
Use findings to decide baseline acceptance and prioritize the remaining roadmap.

## Inputs still needed

YOLO output sample and format (JSON/CSV/API/manual), application/version, label set,
count semantics, supported media, access to test it and a human reference reviewer.
Confirm permission to retain/share team media before assembling the benchmark package.
