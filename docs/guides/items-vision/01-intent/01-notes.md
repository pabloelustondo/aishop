# 01 — Intent: Items Vision — From Image to Item Report

VISTA Agentic Items Vision is the proposed name of this presentation.
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
The browser's Agent page lets an authorised user sign in and upload a JPEG photo.
It guides the user through uploading, waiting, and reading the result.
The report shows identified products and their visible facing counts.
A facing is a visible product front; it does not reveal stock hidden behind it.
The interface also offers retry or refinement where the record allows it.
The Agent uses visual evidence and learned product knowledge to identify and count visible items.

## The server side: where the work is coordinated
The server checks identity and permission before accepting a request.
Cloud Storage holds the source image; Firestore holds status and reports.
The server submits the image and analysis instructions to OpenAI.
The background implementation collects the result through server-side tasks.
The browser reads progress; it does not have to keep the AI request alive.
Success and failure are recorded so the user can see what happened.
Model observations remain subject to uncertainty and human review.

## Presentation Agenda
The sections take inspiration from SDLC2 and follow the presentation's own flow.

1. Context and Domain: the shelf-photo problem and why item recognition matters.
2. Intent: what the system should achieve and what the audience will understand.
3. System and Use Cases: follow one user's photo from upload to report.
4. Success Criteria: explain how we assess useful, accurate, and reliable results.
5. Visual Example: show the uploaded image, interface states, and resulting report.
6. Solution Architecture: map the interface, endpoints, storage, AI, and data flow.
7. Low-Level Design and Code: connect key requests and processing steps to code.
8. Operational Reality: show what is implemented, deployed, and verified in use.
9. Observability and Learning: explain diagnostics, failures, and lessons learned.
10. Future Steps: roadmap.

## Visual walkthrough
Start with the user uploading a photo through the browser interface.
Follow the request to the server, which coordinates storage and AI analysis.
The server keeps the source image and analysis record, then saves the outcome.
Return to the browser, where the user reads status and the saved item report.
The diagram simplifies the flow; collection tasks and individual API calls come later.
The SVG is the editable visual source; the PNG is its presentation render.
