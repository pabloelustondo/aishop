# Architecture: turning shelf images into useful information

The Vision Agent API lets an application submit a shelf photograph or video
and receive a structured report of visible products, their facing counts,
and uncertainty in the analysis. It preserves the original evidence so a
person can compare the report with what the camera actually captured.

The purpose is to make shelf analysis a reusable server capability.
An iPhone app, a web application or a command-line client can use the same
service without implementing video preparation or connecting directly to AI.
The current API focuses on identification and counting. Price comparison
and helping shoppers find suitable products are broader goals, not outputs
this API already guarantees.

## How the work flows

1. **Submit evidence.** The application uploads one photograph or video.
2. **Prepare and analyse.** The server prepares the visual input and asks AI
   to identify and count the visible products.
3. **Review the result.** The application retrieves the report and displays
   it alongside the original evidence for human review.

For video, the server selects representative frames and analyses them together
as one shelf scan. The intended result avoids counting the same product facing
again when it appears in overlapping frames. Accuracy still needs validation.

## Why processing happens in the background

Uploading and analysing are separate stages. A detailed shelf can take longer
to analyse than a normal web request should stay open. The architecture stores
the work on the server and processes it in the background, while the application
checks progress and later retrieves the result.

Once the upload is complete and processing has been accepted, closing or
refreshing the page does not make the page responsible for finishing analysis.
An interrupted upload is different: the remaining bytes still need to be sent.
Background processing does not recover an unfinished transfer by itself.

## Who owns what

The client captures or selects media, sends it, and presents progress and results.
The server owns the evidence, analysis status, processing and report history.
AI interprets the visual evidence; people review its findings and uncertainty.
Access controls keep each user's records private while allowing authorized
administrators to inspect runs across users.

This separation supports other client applications and direct testing with curl.
Current limitations are recorded in [limits and review gaps](11-limits-and-gaps.md).
For services, storage paths, identities and deployment regions, see
[implementation details](12-architecture-implementation.md).
