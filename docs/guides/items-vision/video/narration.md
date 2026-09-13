# VISTA Agentic Items Vision — Video Narration

Production direction: warm, conversational English; a friendly preset avatar.
Keep the slides prominent and place the avatar where it does not cover content.
Use the same voice throughout, with brief pauses between ideas and scenes.
These scripts adapt the speaker notes for speech; authoring instructions are omitted.
Estimated duration: about three minutes, depending on voice and pacing.

## 000 — Title
Welcome to VISTA Agentic Items Vision.
This introduction follows a shelf photo from capture to a reviewable item report.
We will connect the user journey with the architecture and the implementation.
First, let's take a minute to understand the business problem behind the module.

## 00 — Business context
Retail teams need to understand what is happening on store shelves.
Which products are visible? How many facings does each product have? And what changed?
Those questions support inventory decisions, brand presentation, and sales.
The two photos show why the original shelf evidence matters: people need to see what was actually there.
VISTA's broader goal is to make capture and analysis more efficient, while keeping the evidence available for review.
The module we are exploring handles one part of that story.
A user uploads a shelf photo, the server coordinates AI analysis, and the browser presents products and visible facing counts.
A facing is a visible product front. It does not tell us how much stock is hidden behind it.
Comparing observations over time is part of the wider business intent; this module does not, by itself, establish automatic change detection.
For now, remember the simple journey: photo in, reviewable item report out.

## 01 — Technical intent
Now let's follow that journey through the architecture.
On the left is the browser interface. An authorised user signs in and uploads a JPEG shelf photo.
The request reaches the server through the analysis API shown above the central box.
Think of an endpoint as the server's front door for a particular operation.
Uploading an image, requesting analysis, and reading the result are distinct responsibilities.
The server checks access, saves the image, and coordinates the analysis.
Cloud Storage holds the original photo. Firestore holds the analysis record, its status, and the report.
On the right, OpenAI receives the image and analysis instructions to identify products and count visible facings.
The background implementation uses server-side tasks to collect the outcome.
The browser can read progress without keeping the original AI request open.
Follow the return arrow to the browser: the user reads the saved result and can review the observations.
Success and failure are recorded. Where the record allows it, the interface offers retry or refinement.
Recognition can be uncertain, so the report remains something to review against the image.
That is the core architecture. Later sections will unpack the requests, code, diagnostics, and operational evidence.
