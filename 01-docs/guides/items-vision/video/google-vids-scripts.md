# Google Vids — Scene Scripts

Google Vids import limits each scene to 800 characters; these scripts adapt the full narration.
Avatar: `Pablo — VISTA`, replacing Caleb; the engaging, low-pitch Persuader voice is retained.
See [custom-avatar.md](custom-avatar.md) for the likeness direction. Animation sync retains the default enabled setting.
The full speaker-note narration remains in `narration.md`.
Cloud draft: [VISTA-Agentic-Items-Vision-Narrated](https://docs.google.com/videos/d/1xIzpujyksYtWBQqK_92Vy_iC9eDyKQD_-bRbDojqi-8/edit).
The generated draft has four scenes: an avatar introduction followed by the three source slides.
Timeline duration: 1 minute 38.7 seconds. Anyone with the link can view; editing remains restricted.

The title slide uses Pablo's original LinkedIn photograph, without retouching.
Default viewing pace: 0.8× (20% slower), with voice pitch preserved and avatar motion synchronized.
The slower MP4 runs 2 minutes 3.4 seconds; the editable Vids source retains its original timing.
Viewing copy: [VISTA Items Vision — slower narration](https://drive.google.com/file/d/18CzKzeCN6lKJvqXHkt3CCszUAJPvvVUq/view).

## 000 — Title
Welcome to VISTA Agentic Items Vision. This introduction follows a shelf photo from capture to a reviewable item report. We will connect the user journey with the architecture and the implementation. First, let's take a minute to understand the business problem behind the module.

## 00 — Business context
Retail teams need to know what is on the shelf: which products are visible, how many facings each has, and what changed. Those questions support inventory decisions, brand presentation, and sales. These two photos show why the original evidence matters. VISTA aims to reduce inspection effort while keeping the images available for review. This module handles one part of that story: a user uploads a shelf photo and receives identified products and visible facing counts. A facing is a visible product front, not the stock hidden behind it. Comparing visits is a wider business goal, not a claim that this module already detects changes automatically. Remember: photo in, reviewable item report out.

## 01 — Technical intent
Start on the left: an authorised user uploads a JPEG photo in the browser. The central server API is the front door for uploading, requesting analysis, and reading results. The server checks access and coordinates the work. Cloud Storage keeps the photo; Firestore keeps status and reports. On the right, OpenAI receives the image and instructions to identify products and count visible facings. Server-side tasks collect the background outcome, so the browser need not keep the AI request open. Follow the return arrow: the user reads progress and the saved report. Success and failure are recorded, with retry or refinement where allowed. Recognition can be uncertain, so observations need review against the image. Later sections will explore the code and diagnostics.
