# Proof of Concept 02 — Auditable Shelf Review

HumanReviewerInitials: PME

## Question

Can AI Shop create a durable shelf-scan record that a human can review without losing the original image or original AI findings?

## Hypothesis

One iPhone capture can produce an immutable evidence record, an initial AI report, and a private review task that a human can verify or challenge.

## End-to-end proof

1. Capture the original full-resolution JPEG on the iPhone.
2. Upload the exact bytes without resizing or recompression.
3. Store the original image under a unique scan ID.
4. Record a server timestamp and SHA-256 image hash.
5. Analyze the scan and store the structured AI findings unchanged.
6. Show the submission in a private dashboard.
7. Render a scaled browser preview while allowing access to the original image.
8. Let an authorized reviewer verify, correct, or reject the scan and add a note.
9. Preserve the human review separately from the initial AI findings.

## Success criteria

- The stored image hash matches the exact uploaded image.
- The dashboard connects one image, one initial report, and its review state.
- Long Target Product and Area Scan findings remain readable.
- A reviewer can complete a decision without changing the initial findings.
- Reviewer identity and server-side review time are retained.
- Failed analysis remains distinguishable from rejected or corrected analysis.
- A later reader can reconstruct the initial and reviewed states.

## Boundaries

- Private proof-of-concept access only; no public dashboard.
- No automatic deletion; a formal retention policy comes later.
- Avoid capturing people or unrelated personal information.
- This proof does not claim regulatory-grade chain of custody.
- Scan-level decisions and correction notes are sufficient initially.
- Per-product editing, analytics, search, and bulk workflows are excluded.
