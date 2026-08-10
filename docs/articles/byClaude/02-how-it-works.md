# How It Works

HumanReviewerInitials: PME

Three pieces, each doing one job.

## The iPhone app (`ios/`)

A native Swift/SwiftUI app. `CameraController` drives the camera and
image capture; `AnalysisViewModel` and `APIClient`/`InspectionAPIClient`
send the image and render whatever comes back. There are two report
screens — one for a single targeted product, one for a scanned area with
multiple products — plus a debug preview for iterating on report design
without burning API calls. The app never holds the OpenAI key; it only
ever talks to the AI Shop server.

## The server (`server/`)

A small Node.js service (Firebase Functions/Admin). It receives the
image, calls the OpenAI API with the protected credential, and returns a
structured report. The newer inspection path does more: it hashes and
stores the original JPEG in object storage under a non-overwriting path,
writes an inspection record linking the image, scan mode, and initial
findings, and exposes a separate reviewer API guarded by its own
authentication.

## The dashboard (`dashboard/`)

A plain HTML/CSS/JS review tool for the second half of the workflow — a
human reviewer signs in, sees pending scans, views the original image
next to the AI's findings, and records a verified, corrected, or
rejected decision.

## The round trip

Photo in the app → upload → server calls OpenAI and, for inspections,
persists the evidence → structured result back to the app for the
person to read → for inspections, the same evidence later surfaces in
the dashboard for a human to confirm or correct.
