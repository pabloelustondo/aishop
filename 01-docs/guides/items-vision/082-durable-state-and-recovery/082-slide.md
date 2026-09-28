# Vision Agent Durable State and Recovery

Versioned records and attempt IDs protect long-running video work.

- Normal video progress moves through uploading, processing, analyzing, and analyzed.
- Failed and cancelled are recorded outcomes that remain visible on GET.
- Session renewal applies only while the upload record is uploading.
- Cancellation uses the latest record version; restart starts a new video attempt.
- Restart requires complete source evidence and re-extracts frames.

Old workers and model runs must not settle a newer attempt.
