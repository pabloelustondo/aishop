# Use Case 04 — Submit and Review a Shelf Inspection

HumanReviewerInitials:PME

## Purpose

Create an auditable shelf-inspection record and allow a human reviewer to verify the app's findings.

## Primary actors

- Inspector using the AI Shop iPhone app.
- Authorized reviewer using the private server dashboard.

## Main flow

1. The inspector selects a scan mode and captures a shelf or product area.
2. AI Shop preserves the exact original JPEG without resizing or recompression.
3. The server assigns a scan ID and records a server timestamp and image hash.
4. The original image is stored as immutable audit evidence.
5. The server obtains structured AI findings and stores them unchanged.
6. The app displays the initial report to the inspector.
7. The new submission appears in the dashboard as **Pending review**.
8. A reviewer opens the full image and compares it with the AI findings.
9. The reviewer marks the submission **Verified**, **Corrected**, or **Rejected** and may add notes.
10. The server retains both the original AI findings and the human review record.

## Alternate flows

- A failed image upload does not create a completed audit record.
- A failed analysis retains the image and records that findings are unavailable.
- An unreviewed submission remains pending without being presented as verified.

## Outcome

The record shows the original evidence, initial machine interpretation, human disposition, reviewer, and timestamps.

## Initial boundary

Sprint 003 may review the scan as a whole. Per-product correction workflows can be added later without overwriting the original findings.
