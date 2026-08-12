# VISTA — Testability, Dependency Injection, and Verification Specification

## Required architecture and test process for camera simulation, repeatable scenarios, automated verification, and field validation

Status: Test-design requirement for the VISTA implementation handoff. This document does not authorize coding.  
Primary directive: VISTA must be designed so that the same product behavior can be driven either by the real iPhone camera or by a deterministic battery of recorded test evidence. The application must not require a pharmacy visit for every functional regression test.

# 1\. Purpose

This document defines how the receiving builder is expected to make VISTA testable, how dependency injection should separate real-world inputs from product decisions, how a fake camera or replay source should work, how test scenarios should be represented, and what evidence must be produced when tests are executed.  
The goal is not to replace physical-device and pharmacy testing. The goal is to create a repeatable “virtual pharmacy” that can exercise the application on every relevant build and detect behavioral errors before field testing.

## 1.1 Required outcome

* A recorded scenario must be able to drive the same analysis pipeline, state machine, automatic-capture decisions, coverage logic, and result presentation used with the real camera.  
* The builder must be able to run the same scenario repeatedly and obtain the same outcome, except where a specifically documented model is nondeterministic.  
* Test execution must prove not only that expected captures occur, but also that invalid captures never occur.  
* The builder must explain the proposed testing environment and receive handshake approval before implementation begins.

# 2\. Interpretation labels

The following labels distinguish product requirements from implementation suggestions:

* \[REQUIRED\] A behavior or testability outcome that the implementation must satisfy.  
* \[RECOMMENDED\] A design pattern that appears appropriate but may be replaced by an equivalent proposal.  
* \[BUILDER RESPONSE\] A question or design decision the receiving builder must answer before coding.  
* \[FIELD-ONLY\] A behavior that cannot be considered fully validated without a physical iPhone or realistic store environment.

# 3\. Non-negotiable testing principles

* \[REQUIRED\] One decision engine. Production and test modes must not contain separate copies of shelf matching, quality gating, guidance, automatic-capture, coverage, or facing-count logic.  
* \[REQUIRED\] Dependency boundaries. AVFoundation, Core Motion, location, wall-clock time, connectivity, and external services must not be accessed directly from VISTA’s business state machine.  
* \[REQUIRED\] Determinism. Test time, frame order, motion, connectivity, and location must be controllable by the test environment.  
* \[REQUIRED\] Visible replay. During an end-to-end replay, the image displayed in the camera viewport must be the same image being analyzed.  
* \[REQUIRED\] Negative-first validation. Floor, door, wrong shelf, adjacent display, blur, movement, insufficient distance, and incomplete coverage must be treated as first-class tests.  
* \[REQUIRED\] Offline verification. The complete visit and local results must be testable with connectivity disabled.  
* \[REQUIRED\] Evidence preservation. Every run must retain enough information to explain why the app changed state, accepted a frame, rejected a frame, or captured a photo.  
* \[REQUIRED\] Field validation remains mandatory. Replay proves repeatability and logic; it does not prove camera focus behavior, thermal performance, ergonomics, or real-store robustness.  
* \[REQUIRED\] Test hooks and sample datasets must not become user-visible production features.

# 4\. Required architectural boundary

The builder should treat the camera as one producer of observations, not as the application itself. After the input boundary, VISTA should operate on application-owned data types.  
Conceptual flow:  
Real iPhone camera ─┐  
Recorded images/video ├─\> Input adapters ─\> Analysis pipeline ─\> Decision/state machine ─\> UI and capture actions  
Scripted test frames ─┘

## 4.1 Camera frame source

\[REQUIRED\] The application must depend on an injectable camera-frame source. The production implementation receives live frames from the iPhone camera. The test implementation produces frames from still images, ordered image sequences, or recorded video.  
\[RECOMMENDED\] Define an application-owned CameraFrame containing the pixel buffer or image, timestamp, orientation, dimensions, and scenario metadata required by the analysis pipeline.  
\[BUILDER RESPONSE\] Propose the exact interface and explain how live AVFoundation sample buffers and replayed files will become the same CameraFrame type.

## 4.2 Photo capture boundary

\[REQUIRED\] Automatic capture must also be injectable. In production, an accepted state requests a real high-resolution photo. In replay mode, the same request must produce a deterministic captured artifact associated with the accepted frame.  
\[BUILDER RESPONSE\] Explain how replay mode will preserve the distinction between preview frames and accepted still photographs without implementing a second capture workflow.

## 4.3 Motion, clock, location, and connectivity

\[REQUIRED\] The following sources must be replaceable in tests:

* Motion or stability source: real device motion in production; scripted stable/moving values in tests.  
* Clock: real time in production; controllable time in tests so stability windows and timeouts do not require real waiting.  
* Location: real GPS as supporting evidence; fixed scenario location in tests.  
* Connectivity: real reachability in production; offline, online, interrupted, and recovered states in tests.

\[RECOMMENDED\] Persistence, synchronization, recognition-model execution, and server double-check should also have injectable boundaries, even if their first POC implementations are local or simulated.

## 4.4 Composition roots

\[REQUIRED\] The builder must define two explicit application compositions:

* Production composition: live camera, real motion, real clock, real location, real connectivity, production persistence and sync.  
* Replay/test composition: scenario frame source, scripted motion, controlled clock, fixed location, controlled connectivity, isolated test persistence and fake or test server.

\[REQUIRED\] The selection of replay mode must be controlled by test configuration, launch arguments, or a test target. It must not be an ordinary production setting.

## 4.5 State machine separation

\[REQUIRED\] Product decisions should be testable without rendering the camera UI. Given observations such as shelf-match confidence, sharpness, stability, product scale, target-area alignment, and new coverage, the decision layer must produce an observable state, instruction, guide color, capture permission, and progress update.  
\[BUILDER RESPONSE\] Describe which portion of the state machine will be pure or side-effect-free and which side effects will be executed by adapters.

# 5\. Fake camera and scenario replay environment

## 5.1 Required replay modes

* \[REQUIRED\] Single-image mode for classification, recognition, blur, exposure, shelf matching, and facing-count regression tests.  
* \[REQUIRED\] Ordered image-sequence mode for state transitions, guidance, automatic capture, and coverage progression.  
* \[REQUIRED\] Recorded-video mode for more realistic motion and timing.  
* \[RECOMMENDED\] Step mode, in which a tester advances frame by frame.  
* \[RECOMMENDED\] Accelerated mode for CI and regression testing.  
* \[RECOMMENDED\] Real-time mode for human review of the UI and instructions.

## 5.2 Scenario package

\[REQUIRED\] Each scenario must be self-describing and versionable. At minimum it should identify:

* Scenario ID, name, purpose, and dataset version.  
* Assigned store and target shelf area.  
* Onboarding reference image and target rectangle.  
* Catalog and recognition-model version.  
* Input image, sequence, or video.  
* Frame timing or playback rate.  
* Scripted motion, location, and connectivity when relevant.  
* Expected state transitions and permitted transition windows.  
* Expected Spanish instruction and guide color at each checkpoint.  
* Whether automatic capture is permitted or forbidden.  
* Expected accepted captures and coverage changes.  
* Expected local brand/product facing results and confidence policy when applicable.  
* Expected terminal state and synchronization status.

## 5.3 Illustrative scenario

Example: floor\_to\_complete\_shelf\_01

* Frames 0–40: pharmacy floor and display edge. Expected: “Buscando la góndola…”. Capture forbidden.  
* Frames 41–90: correct gondola visible but distant and blurry. Expected: “Acercate a la góndola.” Capture forbidden.  
* Frames 91–130: complete registered shelf, sharp and stable. Expected: global acceptance and one automatic global capture.  
* Frames 131–260: overlapping close views. Expected: detailed guidance, accepted captures only in valid regions, and increasing coverage.  
* Final frames: target rectangle sufficiently covered. Expected: local facing summary and inspection complete.

The exact manifest format is a builder proposal. JSON, property lists, or another reviewable text format are acceptable if the content remains explicit and diffable.

# 6\. Test dataset and ground truth

## 6.1 Dataset contents

\[REQUIRED\] The initial dataset must include both positive and negative evidence. Minimum categories:

* Registered shelf, complete and correctly framed.  
* Registered shelf at several distances and angles.  
* Wrong shelf and similar shelf from another store.  
* Pharmacy floor, entrance, door, ceiling, aisle, and adjacent displays.  
* Sharp, blurry, moving, overexposed, underexposed, glare, shadow, and partial occlusion variants.  
* Products too small, acceptable size, and excessively close.  
* Overlapping detailed regions, duplicate regions, and a sweep with a deliberate uncovered gap.  
* Known catalog products with human-counted facings.  
* Unknown, unreadable, or out-of-catalog products.  
* Offline completion, interrupted synchronization, retry, and server double-check scenarios.

## 6.2 Ground-truth labels

\[REQUIRED\] Each scenario must have expected results approved or reviewed by a human. Ground truth must distinguish facts from thresholds:

* What physical content appears in the frame.  
* Whether it is the correct store shelf.  
* Whether the image is acceptable for global identification.  
* Whether it is acceptable for detailed analysis.  
* Human facing counts per relevant brand/product.  
* Which regions of the target rectangle are covered.  
* Which instruction should be dominant.  
* Whether capture is absolutely forbidden, allowed, or expected.

\[REQUIRED\] Expected model confidences must not be hard-coded as universal product requirements. Tests should normally assert outcome ranges, ranking, or policy decisions rather than one exact floating-point number.

## 6.3 Dataset governance

* \[REQUIRED\] Dataset versions must be immutable once used as a reported baseline.  
* \[REQUIRED\] Changes to labels require reviewer identity, rationale, and a new version.  
* \[REQUIRED\] Original full-resolution images should be retained when legally and operationally permitted.  
* \[REQUIRED\] Store, employee, customer, and personally identifying information must be handled according to the team’s privacy policy.  
* \[RECOMMENDED\] Maintain separate development, validation, and holdout sets so thresholds are not tuned against every test image.

# 7\. Required test layers

## 7.1 Pure unit tests

Test the state machine, threshold policy, coverage mathematics, result aggregation, retry policy, and session lifecycle without camera hardware or UI.

## 7.2 Image-level computer-vision regression tests

Feed individual labeled images into matching, quality, recognition, and counting components. Record acceptance/rejection, metrics, candidates, counts, and latency.

## 7.3 Scenario-replay integration tests

Run full ordered scenarios through the injected sources. Verify the complete sequence of states, instructions, guide colors, capture events, coverage updates, results, and terminal status.

## 7.4 Automated UI tests

Launch the application in replay mode, display the replayed camera evidence, and assert visible store context, instructions, progress, LOCAL status, results, and completion behavior. UI tests must prove that presentation agrees with the decision engine.

## 7.5 Offline and synchronization tests

Complete an inspection with connectivity disabled; verify that local results are available and the visit completes. Then restore connectivity and verify queued, retrying, synchronized, and server-verified states without modifying the original local result.

## 7.6 Physical-iPhone tests

\[FIELD-ONLY\] Validate camera permissions, focus/exposure behavior, capture latency, dropped frames, device motion, memory, heat, battery use, interruption/recovery, airplane mode, and background/foreground transitions.

## 7.7 Pharmacy or realistic-shelf field tests

\[FIELD-ONLY\] Validate actual lighting, glare, shelf depth, changing products, similar gondolas, walking distance, framing ergonomics, tripod assumptions, and usability by a non-technical operator.

# 8\. Minimum behavioral scenario battery

The first implementation must include, at minimum, scenarios that prove the following:

1. The pharmacy floor never produces green guidance or automatic capture.  
2. A wrong shelf is rejected.  
3. A visually similar but unregistered shelf is rejected or held for further evidence.  
4. The registered shelf while too distant produces an approach instruction and no capture.  
5. The complete registered shelf, sharp and stable, can produce one global automatic capture.  
6. Movement blocks capture and produces the correct single instruction.  
7. Blur or poor image quality blocks capture.  
8. A detailed view outside the registered rectangle is rejected.  
9. A valid detailed view inside the rectangle can be captured automatically.  
10. A duplicate view does not incorrectly advance coverage.  
11. An incomplete sweep does not finish the inspection and identifies a remaining region.  
12. A complete sweep finishes based on coverage rather than a fixed number of photographs.  
13. Known products produce the expected preliminary local facing summary within an agreed tolerance.  
14. Unknown products remain unknown rather than being forced into an incorrect catalog identity.  
15. The complete inspection works in airplane mode.  
16. The final screen shows local facings by brand/product and an accurate sync status.  
17. Failed synchronization preserves the inspection and can be retried safely.  
18. Replaying the same scenario produces the same state and capture sequence.

# 9\. Test execution procedure

For each automated or reviewed test run, the builder must follow this sequence:

1. Select the application build, app version, model version, catalog version, onboarding-profile version, and dataset version.  
2. Start with isolated test persistence so earlier sessions cannot affect the outcome.  
3. Load the scenario and validate that all referenced assets and ground-truth labels exist.  
4. Run in the declared playback mode: step, accelerated, or real time.  
5. Capture the ordered state-transition log and all automatic-capture events.  
6. Compare actual observations with expected states, instructions, colors, captures, coverage, facing results, and terminal status.  
7. Fail the scenario when a forbidden capture occurs, even if later states appear correct.  
8. Preserve diagnostics for every mismatch: frame/time, image identity, input metrics, previous state, new state, instruction, and decision reason.  
9. Produce a machine-readable result and a concise human-readable summary.  
10. Classify failures as product logic, CV/model regression, dataset/label problem, UI mismatch, nondeterminism, performance, or infrastructure.  
11. Require explicit review before updating an approved expected result or baseline.

# 10\. Required observability

\[REQUIRED\] A test must be explainable. At minimum, scenario reports should expose:

* Scenario and artifact versions.  
* Ordered state transitions with timestamps or frame numbers.  
* Shelf-match, quality, stability, scale, target-alignment, novelty, and coverage observations used by decisions.  
* Every automatic-capture request and whether it succeeded.  
* Why a capture was accepted, blocked, or cancelled.  
* Coverage before and after each accepted detailed capture.  
* Local facing results, candidates, confidence, and aggregation.  
* Connectivity and sync-queue transitions.  
* Execution duration, analysis latency, dropped frames, and relevant errors.  
* Screenshots or short replay evidence for end-to-end UI failures.

\[REQUIRED\] Logs must be useful for testing without exposing unnecessary personal or store-sensitive data.

# 11\. Automation and continuous integration

* \[REQUIRED\] Pure unit tests and a fast image-regression subset must run automatically on ordinary code changes.  
* \[REQUIRED\] The complete deterministic scenario suite must be runnable without camera hardware.  
* \[RECOMMENDED\] Run the full replay and UI suite on a scheduled or pre-release basis if it is too expensive for every commit.  
* \[REQUIRED\] A network guard or equivalent evidence must demonstrate that capture and local results do not require a network request.  
* \[REQUIRED\] Test reports must be retained and comparable across builds.  
* \[RECOMMENDED\] Track false acceptance, false rejection, facing-count error, unknown rate, coverage correctness, latency, and crash rate as trends rather than isolated pass/fail values.  
* \[FIELD-ONLY\] Physical-device and store checks should be a release gate for meaningful field builds, not for every local code change.

# 12\. Acceptance criteria for the testing environment

The testing environment is acceptable only when all of the following are demonstrated:

* The application can switch between live and replay input through composition, not by changing product decision code.  
* The camera viewport and analysis pipeline consume the same replayed evidence.  
* Clock, motion, location, and connectivity can be controlled in tests.  
* A complete inspection scenario runs without a physical camera.  
* Forbidden captures fail tests immediately.  
* Coverage and local facing results are observable and assertable.  
* The same scenario is repeatable.  
* The suite works while network access is disabled.  
* A human-readable report explains failures.  
* At least one physical-iPhone test confirms that the live adapter behaves consistently with the tested contracts.  
* Test/replay controls and datasets are excluded from or safely inaccessible in the user-facing production application.

# 13\. Builder deliverables before and during implementation

## 13.1 Before coding

* A dependency-injection diagram showing production and replay compositions.  
* Proposed application-owned interfaces for frame input, photo capture, motion, clock, location, connectivity, persistence, model execution, and synchronization.  
* A proposed scenario manifest with one complete example.  
* A proposed test matrix mapping requirements to test layers.  
* A list of what will be simulated, what will be real, and what requires a physical iPhone or pharmacy.  
* An explanation of how test-only capabilities are prevented from becoming production features.  
* Answers to all questions in Section 14\.

## 13.2 With the first executable slice

* Replay of at least one negative scenario and one valid global-capture scenario.  
* Unit tests proving capture is unreachable when required conditions are false.  
* A state-transition log and test report.  
* Instructions for adding a new scenario without changing application code.

## 13.3 Before POC acceptance

* The complete minimum scenario battery in Section 8\.  
* Offline and synchronization tests appropriate to the implemented slice.  
* Physical-iPhone evidence.  
* A field-test checklist and results.  
* A regression summary comparing the candidate build with the approved baseline.  
* A list of remaining evidence gaps and known limitations.

# 14\. Questions the builder must answer

1. Where exactly is the input boundary between AVFoundation and application-owned VISTA logic?  
2. What is the proposed CameraFrame representation?  
3. How will live frames and replay frames follow the same analysis path?  
4. How will the test viewport display exactly what the analyzer receives?  
5. How will automatic photo capture behave in replay mode?  
6. How will preview-frame acceptance map to a high-resolution captured artifact?  
7. How will motion and stability be simulated?  
8. How will elapsed-time requirements and timeouts be controlled without real waiting?  
9. How will location and connectivity be injected?  
10. Which persistence and synchronization dependencies will be replaced in tests?  
11. What is the scenario-manifest format, and how is it versioned?  
12. How are expected state transitions represented when timing may vary within a tolerance?  
13. How are forbidden captures asserted?  
14. How are target rectangles, homographies or other spatial mappings represented in scenario evidence?  
15. How will detailed coverage be calculated and verified?  
16. How will duplicate views be detected and tested?  
17. How will human facing-count ground truth be created and reviewed?  
18. Which metrics are exact assertions and which use tolerance ranges?  
19. How will nondeterministic model output be constrained or evaluated?  
20. Which tests run on every change, nightly, before release, on a physical iPhone, and in a pharmacy?  
21. What diagnostics will be available when a scenario fails?  
22. How will reports compare results across app, model, catalog, profile, and dataset versions?  
23. How will test assets and replay controls be excluded from the production user experience?  
24. What effort is required to add a new store, shelf, catalog, and scenario?  
25. Which parts of this specification does the builder recommend changing, and why?

# 15\. Recommended implementation order

1. Define application-owned observation and decision types.  
2. Implement the state machine and side-effect boundaries with pure unit tests.  
3. Add the live camera adapter and the still-image replay adapter.  
4. Add a minimal scenario manifest and automated negative/positive image tests.  
5. Add ordered sequence/video replay with controlled clock and motion.  
6. Connect replay to the camera viewport and automated UI tests.  
7. Add coverage scenarios and preliminary local facing-result assertions.  
8. Add offline persistence and controlled synchronization scenarios.  
9. Validate adapters and performance on a physical iPhone.  
10. Run a realistic shelf and pharmacy field test, then add every discovered failure as a repeatable regression scenario.

# 16\. Required test report format

Every formal test report should contain:

* Build and artifact versions.  
* Environment and device/simulator information.  
* Scenario and dataset versions.  
* Summary: passed, failed, blocked, and not run.  
* Requirement-to-test traceability.  
* Forbidden-capture results.  
* Global-match results.  
* Quality and stability results.  
* Coverage results.  
* Local facing-count results.  
* Offline and synchronization results.  
* Performance observations.  
* Failure details with evidence.  
* Changed baselines or labels and their approvals.  
* Known gaps requiring physical-device or field testing.  
* Recommendation: accept, accept with conditions, or reject.

# 17\. Handoff response requested from the builder

The receiving builder must read this document together with the current VISTA system model and handoff materials, then produce a Testability and Verification Readiness Plan. The response must:

* Confirm understanding of the required outcomes.  
* Present the proposed dependency-injection architecture.  
* Show the production and replay composition paths.  
* Define the scenario package and test dataset structure.  
* Map the minimum behavioral battery to unit, integration, UI, physical-device, and field tests.  
* Answer every question in Section 14\.  
* Separate confirmed requirements from recommendations and new implementation proposals.  
* Identify unresolved decisions, risks, effort, and expensive-to-change choices.  
* State exactly what evidence will be delivered with each implementation slice.

Do not write code, create scaffolding, initialize an Xcode project, or install dependencies as part of this response. Await the project’s explicit implementation authorization.  
