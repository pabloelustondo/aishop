# VISTA iPhone Architecture

## Offline edge intelligence, server confirmation, and analytics

**Internal architecture position**

## Executive decision

VISTA should be a native, offline-capable iPhone application with a conventional client/server architecture.

The iPhone is responsible for the time-critical field experience: guiding the inspector, capturing excellent images, validating image quality, recognizing catalog products, counting visible facings, explaining uncertainty, and preserving a complete local audit package. This normal path must work without internet access.

When connectivity is good enough, the application sends the complete inspection package to the server. The server confirms or revises the result, archives the evidence, manages human review and stronger-model escalation, and becomes the authoritative source for shared operational data.

After enough confirmed server data exists, a separate analytics and data-science layer can provide dashboards, trends, quality metrics, model-performance evidence, and business insights.

In one line:

**offline-capable iPhone inspection \+ deferred synchronization \+ server confirmation and archival \+ analytics over confirmed data**

## Why this architecture fits VISTA

VISTA operates in stores, where connectivity can be unavailable, slow, or unreliable. The inspector cannot wait for a server round trip while positioning the camera or deciding whether another image is required.

The iPhone already contains the camera, motion sensors, compute, local storage, catalog, and Apple on-device AI frameworks needed for the immediate workflow. Local processing makes guidance fast, protects the field experience from network failures, and allows the application to use high-resolution evidence before it is compressed for transport.

The server is still essential. It provides shared truth, central retention, catalog and profile distribution, independent verification, review workflows, stronger-model escalation, cross-store comparison, and long-term analytics. The design is not “phone instead of server.” It is a clear division of responsibility between the two.

## Responsibility split

| Layer | Primary responsibilities | Must the inspector wait? |
| :---- | :---- | :---- |
| iPhone application | Capture guidance, quality checks, shelf localization, facing detection, SKU matching, counting, confidence, corrections, local audit, offline queue | No network dependency |
| Server platform | Receive and acknowledge packages, verify or reprocess evidence, confirm results, archive records, manage catalog/profile versions, route human review and cloud-model exceptions | No; synchronization is deferred |
| Analytics and dashboard | Metrics, trends, comparisons, data quality, recognition performance, operational KPIs, exports | Not part of the capture path |

## iPhone architecture

### Native application shell

* **SwiftUI** provides the application screens and state-driven workflow.

* **AVFoundation** owns camera preview, photo capture, exposure, focus, and capture metadata.

* **Core Motion** contributes stability and device-orientation evidence when useful.

* A local workflow engine enforces the onboarding and recurring-inspection states.

### Apple intelligence and computer vision

The recognition layer should expose capability-oriented interfaces rather than hard-code a model name. The application needs capabilities such as assessCaptureQuality, detectFacings, identifySKU, recognizeText, and explainUncertainty.

Those capabilities may be implemented with several Apple technologies:

* **Vision** for text recognition, barcode recognition, rectangles, tracking, and integration with specialist models.

* **Core AI** for eligible newer neural and generative models distributed as Apple-optimized model assets.

* **Core ML** for mature specialist models when it remains the simplest and best-supported deployment route.

* **Foundation Models** for bounded local language assistance when the system model satisfies the requirement.

* **Deterministic Swift code** for catalog rules, thresholds, duplicate suppression, state transitions, and count aggregation.

Core AI is a framework, not the recognition model itself. Apple's current demonstration shows models such as SAM3 and Qwen working together entirely on-device. That validates the deployment direction, but VISTA must still measure the accuracy, latency, memory, battery, and thermal behavior of its own pipeline.

### Local recognition pipeline

1. Load the approved onboarding profile and the applicable catalog version.

2. Guide the inspector to the correct shelf or bay.

3. Evaluate stability, blur, glare, distance, angle, framing, and coverage before accepting a capture.

4. Preserve the best full-resolution image and generate corrected or overlapping high-resolution tiles when required.

5. Detect one candidate region for each visible product facing.

6. Match each candidate against the permitted catalog using visual evidence, OCR, barcode evidence when available, and deterministic business rules.

7. Suppress duplicate detections and count accepted boxes by SKU.

8. Mark low-confidence or conflicting candidates as uncertain; never force every region to match a catalog item.

9. Allow the inspector to accept, correct, or request another capture.

10. Save the evidence and audit trail locally as one resumable inspection package.

The count is the number of accepted, deduplicated facing detections. It is not a number generated in prose by a language model.

## Offline and connected behavior

### Offline mode

The complete field workflow continues without connectivity:

* the inspector can open a provisioned store/category profile;

* capture guidance and quality checks continue;

* local recognition and counting continue;

* evidence and corrections are saved safely;

* the session ends with a clear local result and a pending-sync status.

The application must not pretend that an unsynchronized result is already confirmed by the server.

### Connected mode

When the connection meets a defined quality threshold, the application uploads the complete inspection package in the background. Upload is resumable and idempotent: retrying the same package must not create a duplicate inspection.

The server acknowledges the exact package manifest received. It can then:

* validate integrity and required metadata;

* rerun selected recognition or quality checks;

* compare local and server results;

* send difficult cases to a stronger model or human reviewer;

* confirm, revise, or reject the local result;

* archive the authoritative record and evidence;

* return status and corrections to the phone.

The local operational result is useful immediately. The confirmed server record becomes authoritative after synchronization and review.

## Inspection package and audit

Each package should contain enough evidence to reproduce and explain the result:

* run ID, store ID, category or bay ID, onboarding profile ID and version;

* catalog version, application version, device and operating-system metadata;

* model/runtime identifiers and recognition thresholds;

* original accepted images, relevant derived crops or tiles, and capture metadata;

* image-quality measurements and guidance events;

* detections, SKU candidates, accepted labels, counts, and confidence values;

* inspector corrections, review state, and unresolved uncertainty;

* ordered audit events, timestamps, content hashes, and the package manifest.

Images and operational data should use iOS data protection at rest and encrypted transport. Retention, incidental-person handling, deletion authority, and access roles remain explicit policy decisions rather than implementation assumptions.

## YOLO and detector alternatives

VISTA needs a facing-detection capability. It does not require YOLO specifically.

The common Ultralytics YOLO distribution is offered under AGPL-3.0 and an Enterprise license. A personal experiment or a fully open-source implementation can use the AGPL route. A proprietary or commercial VISTA product that does not release the complete corresponding source would normally require an Ultralytics commercial license, subject to legal review.

Therefore the decision is:

* do not make Ultralytics YOLO a structural dependency;

* use it for a prototype only if its license is acceptable for that prototype;

* compare it with another appropriately licensed detector or a custom detector trained and deployed through the Apple toolchain;

* keep the application contract stable so the detector can be replaced without changing the workflow, persistence, synchronization, or dashboard layers.

The model choice should be made by a VISTA benchmark, not by popularity. Required measures include per-SKU precision and recall, facing-count error, unknown rate, confidence calibration, target-device latency, peak memory, battery use, thermal behavior, and review load.

## Server and dashboard evolution

The first server release should remain operationally small:

1. authenticated, resumable package upload;

2. integrity validation and idempotent acknowledgment;

3. evidence storage and a confirmed-result record;

4. catalog and onboarding-profile version distribution;

5. review queue and correction capture;

6. basic export and observability.

The dashboard should follow the data, not precede it. Once confirmed records accumulate, useful metrics may include:

* visits completed and synchronized;

* image-quality and recapture rates;

* facings by SKU, store, category, and period;

* gaps, out-of-stock signals, and competitor displacement;

* local-versus-server disagreement;

* human-review rate and correction patterns;

* model precision, recall, count error, and confidence calibration;

* local processing latency, synchronization delay, and backlog;

* catalog, onboarding-profile, and model-version performance.

## Alternatives considered

### Cloud-first recognition

The phone captures images and waits for server analysis. This is simpler on the client and allows larger models, but it makes the inspector dependent on connectivity, introduces latency during capture, increases recurring inference cost, and weakens offline operation. It remains useful as a benchmark and server-side confirmation path, not as the default field architecture.

### Fully local with no server

This is adequate for an isolated technical POC, but it cannot provide shared truth, central review, archival, catalog/profile distribution, multi-store analysis, or reliable dashboard data. It is not the complete product architecture.

### One general VLM for everything

This minimizes the apparent number of components but combines capture quality, localization, SKU recognition, counting, explanation, and uncertainty into one hard-to-measure responsibility. It may remain an experimental baseline. It should not be the precision architecture unless the VISTA benchmark demonstrates exact, repeatable performance.

## POC implementation priorities

1. Prove the guided capture and local persistence walking skeleton on the target iPhone.

2. Prove one end-to-end local shelf count in airplane mode against a versioned catalog and human ground truth.

3. Keep recognition adapters replaceable across Vision, Core ML, Core AI, and external runtimes.

4. Add a resumable mock/server synchronization contract using immutable package IDs and manifest hashes.

5. Verify the same inspection package can be replayed locally and on the server.

6. Measure quality, count accuracy, latency, memory, battery, heat, upload behavior, and disagreement.

7. Build the first operational dashboard only after confirmed server records exist.

## Architectural conclusion

VISTA should feel like an intelligent camera application in the inspector's hand and behave like a disciplined client of an authoritative server platform.

The iPhone makes the visit fast, guided, and resilient. The server makes the result shared, reviewable, auditable, and analytically useful. The dashboard turns accumulated confirmed evidence into business intelligence.

## Official references

* Apple Developer: [Core AI](https://developer.apple.com/documentation/coreai), its [integration guide](https://developer.apple.com/documentation/coreai/integrating-on-device-ai-models-in-your-app-with-core-ai), and the WWDC26 session [Integrate On-Device AI Models into Your App Using Core AI](https://developer.apple.com/videos/play/wwdc2026/326/).

* Apple Developer: [Vision](https://developer.apple.com/documentation/vision), [Recognizing Text in Images](https://developer.apple.com/documentation/vision/recognizing-text-in-images), and [Recognizing Objects in Live Capture](https://developer.apple.com/documentation/vision/recognizing-objects-in-live-capture).

* Ultralytics: [Licensing](https://www.ultralytics.com/license).