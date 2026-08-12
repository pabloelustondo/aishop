# VISTA — Observability, Audit Trail, and Logging Specification

## Required strategy for reconstructing, testing, and auditing every VISTA run

Status: Observability requirement for the VISTA implementation handoff. This document does not authorize coding.  
Primary directive: for every onboarding or inspection run, VISTA must produce enough structured evidence to reconstruct what the system observed, what it decided, what instruction it gave, how the operator and camera moved, what it captured or rejected, what results it produced, and what happened during synchronization.

# 1\. Purpose

This document defines the observability and audit outcomes expected from the VISTA builder: the logging model, event structure, storage strategy, offline behavior, retention and privacy principles, test integration, reporting, and the questions that must be answered before implementation.  
The objective is not merely to help developers debug crashes. The objective is to make every important action of the VISTA guidance agent reviewable and testable.

## 1.1 Audit promise

Given a run identifier, an authorized reviewer must be able to reconstruct this causal chain:  
Context loaded → camera and motion observations → state evaluation → advice issued → operator/camera response → acceptance or rejection → automatic capture → coverage and recognition → local results → synchronization and server double-check.  
If the system says “Acercate”, “Subí un poco”, or “Perfecto. No te muevas”, the audit must explain exactly when it said it, what evidence caused it, which rule or model result supported it, what happened next, and whether the advice was satisfied.

# 2\. Interpretation labels

* \[REQUIRED\] An outcome the implementation and its tests must satisfy.  
* \[RECOMMENDED\] A suitable technical approach that the builder may replace with an equivalent proposal.  
* \[BUILDER RESPONSE\] A design decision or question the builder must answer before coding.  
* \[FIELD-ONLY\] An aspect that requires a physical iPhone or realistic store validation.

# 3\. Four observability records

VISTA must distinguish four related but different records.

## 3.1 Authoritative audit events

\[REQUIRED\] A lossless semantic history of important actions and decisions: session lifecycle, context, state changes, advice, user actions, capture decisions, accepted photographs, coverage, results, errors, synchronization, and verification. These events form the authoritative run timeline.

## 3.2 Evidence telemetry

\[REQUIRED\] Time-series observations used to justify decisions, such as camera movement, device stability, sharpness, exposure, shelf-match score, product scale, target alignment, coverage novelty, processing latency, and connectivity.  
Telemetry may be sampled or summarized, but the retained resolution must be sufficient to reproduce or explain every state-changing decision and every instruction.

## 3.3 Evidence artifacts

\[REQUIRED\] Images, accepted captures, selected rejected-frame snapshots, model outputs, target rectangles, coverage maps, and scenario inputs referenced by the audit. Artifacts should be stored once and referenced by stable identifier and content hash.

## 3.4 Operational diagnostics

\[REQUIRED\] Developer-oriented warnings, errors, performance diagnostics, and crash information. Platform console logging may support diagnostics, but it is not the authoritative audit trail because it may rotate, redact, or disappear.  
\[REQUIRED\] Metrics and dashboards may summarize behavior, but aggregated metrics never replace per-run audit events.

# 4\. Meaning of “complete audit”

A complete audit does not necessarily mean storing every raw camera frame and every hardware sensor sample forever. It means preserving every semantic decision and enough underlying evidence to validate that decision.

## 4.1 Every instruction

* When the instruction was selected.  
* The exact instruction ID and displayed Spanish text.  
* The state before and after the instruction.  
* The observation window and frame or artifact reference used.  
* The relevant values, thresholds, model version, and rule or policy that caused it.  
* The expected operator action.  
* When the instruction appeared, changed, was satisfied, timed out, or was cancelled.  
* The next observable movement or operator response.

## 4.2 Every relevant movement

\[REQUIRED\] VISTA must retain enough motion evidence to audit every guidance decision. This includes movement direction and magnitude, stability windows, camera displacement when available, and the transition from “moving” to “stable”.  
\[RECOMMENDED\] Store motion telemetry at a documented sampling rate or as lossless time windows around decisions. Each advice and capture decision should reference the exact motion interval it used.  
\[BUILDER RESPONSE\] Propose the raw sampling, aggregation, event-window, and retention strategy. Explain why it is sufficient to validate “Acercate”, “Subí”, “mové a la derecha”, “quieto”, and “no te muevas”.

## 4.3 Every capture decision

* Capture considered, armed, cancelled, requested, completed, failed, or retried.  
* All gating conditions and their pass/fail values.  
* The frame used for the decision and the final captured-photo identifier.  
* Whether the capture was global, detailed, onboarding, or test evidence.  
* Coverage contribution and duplicate/novelty result.  
* No forbidden capture may exist without an explicit failed test and incident record.

## 4.4 Every human action

\[REQUIRED\] Record relevant operator actions such as starting or ending a visit, selecting context, confirming or adjusting a target rectangle, retrying, cancelling, acknowledging an error, reviewing results, and requesting synchronization. Passive physical movement is represented through motion and image observations rather than invented button events.

# 5\. Required event envelope

\[REQUIRED\] Audit records must be structured and machine-readable. Free-form strings alone are insufficient. Every event must contain or inherit the following:

* Schema version.  
* Event ID and strictly increasing sequence number within the run.  
* Run/session ID and visit or onboarding ID.  
* UTC timestamp plus monotonic elapsed time from run start.  
* Event category and typed event name.  
* Actor or source: inspector, KAM, VISTA decision engine, camera, motion source, recognition model, persistence, sync engine, server, test runner, or reviewer.  
* State before and state after when applicable.  
* Correlation and causation IDs linking observations, decisions, advice, actions, captures, and results.  
* Store, assignment, target-area, and onboarding-profile identifiers.  
* App, iOS, device, model, catalog, policy/configuration, and dataset/scenario versions.  
* Structured input or observation snapshot relevant to the event.  
* Decision outcome, reason code, rule or model reference, and relevant threshold values.  
* Advice ID and displayed text when applicable.  
* Frame, image, motion-window, coverage-map, or model-output artifact references and hashes.  
* Result, error, severity, privacy class, and retention class.

\[REQUIRED\] Event fields must use stable names and typed values. The builder must propose a versioned schema and compatibility policy.

# 6\. Minimum event taxonomy

The initial implementation must define typed events covering at least:

* Application and run started, paused, resumed, completed, abandoned, or recovered after crash.  
* Assignment, store, user role, profile, catalog, model, and configuration loaded or rejected.  
* Camera permission, camera start/stop, frame received/dropped, and capture availability.  
* Location and connectivity observations relevant to the session.  
* Motion/stability window opened, updated, accepted, or rejected.  
* Frame evaluated and quality/match/scale/alignment/novelty observations produced.  
* State transition requested, accepted, rejected, or rolled back.  
* Advice selected, displayed, changed, satisfied, expired, or cancelled.  
* Automatic capture considered, armed, cancelled, requested, saved, or failed.  
* Target rectangle proposed, adjusted, confirmed, or versioned during onboarding.  
* Coverage updated, duplicate region detected, uncovered region selected, or completion reached.  
* Recognition started/completed, candidates emitted, unknown selected, and facings aggregated.  
* Local results shown, reviewed, or finished.  
* Audit or persistence write failed, storage pressure detected, or integrity compromised.  
* Sync item queued, upload started, retried, acknowledged, failed, or completed.  
* Server verification received and discrepancy or human-review requirement recorded.  
* Test scenario loaded, assertion evaluated, test passed/failed, and expected-log mismatch detected.

# 7\. Causality and timeline requirements

* \[REQUIRED\] Events in one run must have an unambiguous order even when wall-clock timestamps are equal.  
* \[REQUIRED\] Every advice event must link to the decision and observations that caused it.  
* \[REQUIRED\] Every automatic capture must link to the acceptance decision and its gating evidence.  
* \[REQUIRED\] Every coverage update must link to the accepted capture that caused it.  
* \[REQUIRED\] Every local facing result must link to its input captures, catalog, and model version.  
* \[REQUIRED\] Every synchronized or verified result must preserve, not overwrite, the original local result.  
* \[REQUIRED\] Retried or duplicated operations must be distinguishable and idempotent.  
* \[RECOMMENDED\] Use correlation, causation, and parent-span identifiers so one run can be viewed as both an event timeline and a distributed trace.

# 8\. Where the records live

## 8.1 On the iPhone

\[REQUIRED\] The authoritative audit must be stored locally and work without internet. Critical events must survive application restart and device connectivity loss.  
\[RECOMMENDED\] Use an append-oriented structured event store, with evidence artifacts stored separately and referenced by ID. The builder may propose SQLite, an event file format, or another durable implementation.

## 8.2 Platform diagnostics

\[RECOMMENDED\] Apple unified logging may be used for developer diagnostics and performance investigation. It must not be the only place where audit events exist.

## 8.3 Test environment

\[REQUIRED\] Every automated replay must emit a machine-readable audit file and a concise human-readable timeline as test artifacts. CI must retain failed-run logs and sufficient evidence for diagnosis.

## 8.4 Server after connectivity

\[REQUIRED\] When synchronization becomes available, the local audit package must be uploaded with the inspection evidence. The server must preserve the original ordered device events, record upload acknowledgements, add server-side processing events, and retain separate local and server results.

## 8.5 Human review surface

\[RECOMMENDED\] Provide a simple run-timeline exporter or viewer for the POC. It should allow an authorized reviewer to filter by advice, movement, capture, state, error, recognition, coverage, and sync while keeping access to the complete ordered history.

# 9\. Durability, performance, and failure policy

## 9.1 Critical versus high-volume records

\[REQUIRED\] Critical audit events and durable product actions must remain consistent. A photograph may not be marked saved while the corresponding capture event is absent. A session may not be marked complete without completion and result events.  
\[RECOMMENDED\] Persist critical events transactionally with the state change or artifact manifest. Buffer high-volume telemetry asynchronously with bounded memory and explicit dropped-sample counters.

## 9.2 Logging must not silently damage the visit

* Audit collection must have measured limits on CPU, battery, memory, storage, and capture latency.  
* If noncritical telemetry is dropped, the number, interval, and reason must be recorded.  
* If a critical audit event cannot be persisted, the run must be marked audit-incomplete or integrity-compromised.  
* The builder must propose whether the operator may continue, whether completion is permitted, and how the condition is surfaced.  
* Crash recovery must preserve the last durable sequence number and resume without duplicating events.

## 9.3 Retention and capacity

\[BUILDER RESPONSE\] Propose local storage budgets, retention periods, upload acknowledgement rules, deletion policy, low-storage behavior, and the treatment of abandoned runs. Do not delete evidence merely because synchronization was attempted.

# 10\. Privacy, security, and integrity

* \[REQUIRED\] Collect only data necessary to audit the visit and system decisions.  
* \[REQUIRED\] Separate identifiers and structured events from large photographic evidence.  
* \[REQUIRED\] Protect local and synchronized data according to the project’s security policy.  
* \[REQUIRED\] Redact secrets, access tokens, personal messages, unrelated customer imagery metadata, and other unnecessary sensitive values.  
* \[REQUIRED\] Define authorized access to logs and evidence.  
* \[REQUIRED\] Define retention and deletion responsibilities for device, test, and server copies.  
* \[RECOMMENDED\] Use content hashes for artifacts and tamper-evident chaining or signed manifests for completed audit packages.  
* \[BUILDER RESPONSE\] Explain how integrity can be checked after offline collection and later synchronization.

# 11\. Observability as part of testing

\[REQUIRED\] Logging is itself a tested product feature. Passing functional behavior with missing, malformed, contradictory, or unauditable logs is a failed test.

## 11.1 Scenario assertions

Each fake-camera scenario must assert both the user-visible behavior and the corresponding audit behavior:

* Expected event types occurred.  
* Events are ordered and sequence numbers contain no unexplained gaps or duplicates.  
* Every instruction has observations, decision reason, displayed text, and lifecycle events.  
* Every relevant movement interval is present and linked.  
* Forbidden captures have no capture-completed event.  
* Accepted captures contain all required gate results and artifact references.  
* Coverage and facing results link to their evidence.  
* Versions and context identifiers are complete.  
* Actual audit events agree with the visible UI and saved product state.  
* Unexpected events, fields, or privacy violations fail the test.

## 11.2 Required observability tests

1. Replay a complete valid inspection and verify the full golden event timeline.  
2. Replay floor, door, wrong-shelf, blur, movement, and off-target scenarios and verify no forbidden capture.  
3. Verify every guidance change has a causal observation and decision.  
4. Verify movement and stability evidence supports each movement-related instruction.  
5. Verify duplicate views do not create false coverage.  
6. Verify local facing results link to accepted captures and exact model/catalog versions.  
7. Kill and restart the app during a run; verify recovery and event continuity.  
8. Run fully offline; verify local persistence and later ordered synchronization.  
9. Interrupt synchronization; verify idempotent retry and no event loss.  
10. Simulate telemetry-buffer pressure; verify dropped-sample accounting.  
11. Simulate a critical audit-write failure; verify the declared integrity policy.  
12. Verify schema validation, required fields, typed values, and migration compatibility.  
13. Verify redaction and absence of prohibited secrets or personal data.  
14. Measure logging overhead on the target physical iPhone and iOS runtime.  
15. Compare the human-readable timeline with the machine-readable audit and visible application behavior.

## 11.3 Golden logs

\[RECOMMENDED\] Approved replay scenarios may include expected event sequences or invariant sets known as golden logs. Updates to an approved golden log require explicit explanation and review; tests must never rewrite expected logs automatically.

# 12\. Metrics and operational summaries

\[REQUIRED\] The builder should derive metrics from structured events rather than adding unrelated counters. Candidate metrics include:

* Runs started, completed, abandoned, audit-incomplete, synchronized, and verified.  
* Time spent in each guidance state.  
* Advice frequency, duration, repetition, and success rate.  
* Movement and stability failure rate.  
* Global-match acceptance and rejection.  
* Automatic-capture consideration, cancellation, success, and failure.  
* Quality rejection reasons.  
* Coverage progression, duplicates, and unresolved gaps.  
* Facing count, unknown rate, confidence distribution, and local/server disagreement.  
* Processing latency, dropped frames, dropped telemetry, storage use, battery/thermal observations, and sync retries.

\[REQUIRED\] Metric definitions, units, dimensions, and denominators must be documented. A dashboard is optional for the POC; correct events and reproducible reports are mandatory.

# 13\. Builder deliverables

## 13.1 Before coding

* An observability architecture diagram.  
* The proposed typed event taxonomy and versioned event-envelope schema.  
* The distinction between critical audit events, sampled telemetry, artifacts, diagnostics, and derived metrics.  
* The causal-linking strategy for observation → decision → advice → movement → capture → result.  
* The local, test, server, and human-review storage strategy.  
* The offline durability, retry, crash-recovery, retention, privacy, and integrity policies.  
* The expected performance and storage budget.  
* A complete example timeline for one replayed inspection.  
* Answers to every question in Section 14\.

## 13.2 With the first executable slice

* Structured logs for one negative replay and one accepted-capture replay.  
* Automated assertions validating event order, causality, advice, and forbidden captures.  
* A human-readable timeline report.  
* Evidence that replay behavior, UI, saved state, and audit events agree.

## 13.3 Before POC acceptance

* Audit coverage for all implemented onboarding and inspection states.  
* Observability tests integrated with the approved fake-camera battery.  
* Offline, crash-recovery, sync-retry, schema, privacy, and performance evidence.  
* Physical-iPhone logging-overhead measurements.  
* A documented list of unaudited behaviors and remaining evidence gaps.

# 14\. Questions the builder must answer

1. What is the authoritative audit store, and why was it selected?  
2. Which records are critical audit events, sampled telemetry, evidence artifacts, diagnostics, and metrics?  
3. What is the exact event envelope and schema-version policy?  
4. How are event order, correlation, and causation represented?  
5. How will observations be linked to decisions and displayed advice?  
6. How will every instruction’s creation, display, satisfaction, replacement, and cancellation be audited?  
7. How will motion be sampled or summarized so movement-related advice can be verified?  
8. Which frames or snapshots are retained around state changes, rejected conditions, and captures?  
9. How will artifact identifiers and hashes be generated?  
10. How will capture, persistent state, and critical audit events remain consistent?  
11. What happens if critical audit persistence fails?  
12. What happens when high-volume telemetry is dropped?  
13. How will crashes, app restarts, and interrupted runs preserve event continuity?  
14. What is stored on the phone, in test artifacts, in platform diagnostics, and on the server?  
15. How are local device events preserved when server processing adds new events?  
16. What are the local storage, performance, battery, and retention budgets?  
17. When may local evidence be deleted, and what acknowledgement is required?  
18. How will logs work in airplane mode and synchronize later?  
19. How will privacy, redaction, access control, encryption, and retention be handled?  
20. Will the completed package be tamper-evident, and how will integrity be verified?  
21. What is the human-readable run report or timeline format?  
22. Which metrics and alerts will be derived from the events?  
23. How will test scenarios specify expected log events and invariants?  
24. How will golden logs be reviewed and updated?  
25. Which observability tests run on every change, before release, and on a physical iPhone?  
26. How will the builder demonstrate that logging overhead does not interfere with camera analysis or capture?  
27. Which decisions remain unresolved, and which choices would be expensive to change later?

# 15\. Acceptance criteria

The observability implementation is acceptable only when:

* An authorized reviewer can reconstruct a complete run in order.  
* Every system instruction is linked to its triggering observations and decision.  
* Every relevant movement interval is available to validate the advice.  
* Every capture and rejection is explainable.  
* Coverage and facing results trace back to evidence and versions.  
* The audit works offline and survives restart.  
* Synchronized records preserve the original local history.  
* Test runs automatically validate log structure, completeness, order, causality, and privacy.  
* A logging failure is visible and follows an approved integrity policy.  
* Performance measurements show acceptable overhead on the target iPhone and required iOS runtime.  
* Test hooks and diagnostic controls are not exposed as ordinary production features.

# 16\. Handoff response requested

The receiving builder must produce an Observability and Audit Readiness Plan before implementation. The response must present the architecture, event schema, storage and retention strategy, causal model, test integration, performance budget, privacy and integrity controls, example timeline, and answers to Section 14\.  
Separate confirmed requirements from recommendations, proposed implementation choices, and unresolved questions. Do not write code, create scaffolding, initialize an Xcode project, or install dependencies. Await the project’s explicit implementation authorization.  
