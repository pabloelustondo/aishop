# Sprint 003 — Auditable Shelf Inspection

HumanReviewerInitials:PME

## Goal

Create the first auditable inspection flow: preserve the exact iPhone image, retain immutable AI findings, and let an authorized human review the resulting record in a private dashboard.

This sprint also fixes one bounded physical-iPhone defect carried from Sprint 002. Its reproduction, actual behavior, expected behavior, and affected app version must be captured in a separate approved sprint document before that fix begins.

## Governing requirements

Follow the approved [inspection intent](../../../02-intent/intent-03-auditable-retail-shelf-inspection.md), [review use case](../../../03-system-model-and-use-cases/use-case-04-submit-and-review-shelf-inspection.md), [proof of concept](../../../05-viable-proof-of-concept/proof-of-concept-02-auditable-shelf-review.md), and [audit architecture](../../../06-solution-design-and-architecture/architecture-02-audit-storage-and-human-review.md).

## In scope

- Reproduce, constrain, fix, and regression-test one confirmed iPhone defect.
- Upload the exact original JPEG without resizing or recompression.
- Assign a scan ID; record server timestamps, SHA-256, mode, and app version.
- Store the original image under a private, non-overwriting object path.
- Store initial structured AI findings without later mutation.
- Provide a private dashboard listing pending and recent inspections.
- Show a scaled preview, original image access, and readable Target or Area findings.
- Record **Verified**, **Corrected**, or **Rejected**, optional notes, reviewer identity, and server time separately from AI findings.
- Preserve understandable upload, analysis, storage, authorization, and review failures.

## Delivery order

1. Capture and approve the iPhone defect definition.
2. Define and test the inspection record and storage boundary.
3. Preserve and upload original bytes from the iPhone.
4. Persist images, initial findings, and failure states on the server.
5. Deliver authenticated dashboard list, detail, and review actions.
6. Run automated, deployment, dashboard, and physical-iPhone validation.

## Acceptance and evidence

- Stored bytes produce the same SHA-256 as the uploaded original.
- A submission connects its image, immutable initial findings, status, and review history.
- Unauthorized dashboard and original-image access is denied.
- A reviewer can complete each disposition without overwriting AI output.
- The confirmed iPhone defect is demonstrably fixed without breaking Sprint 002 flows.
- Evidence includes automated results, physical-device proof, hash comparison, access checks, dashboard screenshots, and known limitations.

## Out of scope

Per-product correction editing, analytics, search, bulk review, automatic deletion, formal retention policy, public dashboard access, and regulatory-grade chain of custody remain outside Sprint 003.
