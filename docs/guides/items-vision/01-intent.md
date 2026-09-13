# 01 — Intent: Items Vision — From Image to Item Report

Items Vision is the proposed name of this presentation.
It explains AI Shop's image uploader and analyser implementation.
The intended outcome is simple: understand how a photo becomes an item report.
The audience should follow the story without needing to read source code.

## The endpoint: the server's front door
The API entry point is `/v1/agent/analyses`.
An endpoint is an address where the interface asks the server to do something.
`POST /v1/agent/analyses` uploads an image and creates its analysis record.
`POST /v1/agent/analyses/{id}/run` requests analysis of a saved image.
`GET /v1/agent/analyses/{id}` retrieves its recorded status and result.
Upload, analysis, and reading results have distinct responsibilities.

## The user interface: what the person sees
The browser's Agent page lets an authorised user sign in and select a photo.
It guides the user through uploading, waiting, and reading the result.
The report shows identified products and their visible facing counts.
A facing is a visible product front; it does not reveal stock hidden behind it.
The interface also offers retry or refinement where the record allows it.

## The server side: where the work is coordinated
The server checks identity and permission before accepting a request.
Cloud Storage holds the source image; Firestore holds status and reports.
The server submits the image and analysis instructions to OpenAI.
The background implementation collects the result through server-side tasks.
The browser reads progress; it does not have to keep the AI request alive.
Success and failure are recorded so the user can see what happened.
Model observations remain subject to uncertainty and human review.

## How we will build the presentation
We will use the twelve SDLC2 areas as a lightweight guide.
1. Context and Domain Analysis: explain the shelf-photo problem.
2. Intent: agree on the story, audience, and intended understanding.
3. System Model and Use Cases: follow one user's photo through the system.
4. Benchmarks, Test Strategy, and Success Criteria: define what must be clear.
5. Viable Proof of Concept: try one text-and-image pair first.
6. Solution Design and Architecture: agree on boxes, arrows, and boundaries.
7. Planning: order the remaining pairs into an easy learning sequence.
8. Specifications as Code: check technical claims against API contracts.
9. Build and Test: create each image and verify it against its text.
10. Review and Release: review the completed presentation before sharing.
11. Operational Reality: distinguish implementation from observed deployment.
12. Observability, Insights, and Learning: explain diagnostics and lessons.

## Format and first visual
Each numbered explanation will have a matching image in this folder.
We clarify the text first, then create its PowerPoint-style architecture image.
The first image will show User Interface → Server API → Storage and AI → Report.
