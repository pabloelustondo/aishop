# 02 — One Photo, From Upload to Report

## Core message
Follow one shelf photo through a complete user journey.
The user submits evidence, waits for analysis, and reviews the saved observations.
The photo remains the reference for understanding and checking the report.

## The starting point
Imagine a retail team member who wants to understand a photographed shelf.
They have a JPEG image and access to the browser's Agent page.
Their question is: which products are visible, and how many facings can we see?
A facing is a visible product front; hidden stock cannot be counted from this view.
This is an illustrative scenario, not a measured result from a particular store.

## 1 — Choose and upload
The user signs in with an account authorised to use the Agent.
They select the shelf photo and upload it.
The server checks access and validates the upload before accepting it.
It saves the original image and creates an analysis record with its own identifier.
That record connects the photo, processing status, and eventual report.

## 2 — Start analysis
The browser automatically requests the first analysis after a successful upload.
Uploading the evidence and analysing it are separate operations behind the interface.
The server retrieves the saved photo and submits it to the AI provider.
The instructions ask the model to identify products and count visible facings.
The user does not need to understand these API calls to follow the workflow.

## 3 — Follow progress
Analysis can take time, so the interface shows the recorded processing state.
The background implementation keeps coordination on the server.
Server-side tasks collect the provider's outcome and save it to the analysis record.
Reading progress does not itself request a new AI analysis.
The browser presents the status and result returned by the server.

## 4 — Review the report
When analysis succeeds, the user reads identified products and facing counts.
They compare the observations with the source photo available in the interface.
Small labels, occlusion, and similar packaging can make recognition uncertain.
When refinement is available, the user adds a note explaining what to reconsider.
If a run fails, the interface records the failure and offers retry where allowed.

## Intended visual
Use four large cards in a left-to-right journey: Upload, Analyse, Wait, Review.
Place short user-facing captions above a thin band explaining the server's work.
Carry the same small shelf-photo symbol from the upload card to the report card.
Add one subtle return arrow from Review to Analyse, labelled “Refine with a note”.
Keep detailed endpoints and infrastructure boxes for the architecture section.

## Evidence boundary
This walkthrough follows the current browser and server implementation.
Deployment and observed end-to-end behaviour are covered in Operational Reality.
