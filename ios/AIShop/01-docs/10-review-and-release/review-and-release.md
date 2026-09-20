# AIShop iPhone App: Review and Release

## Sprint review evidence

- Diff limited to approved component-scoped tasks.
- Unit and fixture test results for positive, negative, and distractor videos.
- Simulator demonstration showing a signal before playback completes.
- Best-frame, timestamp, similarity, latency, and dropped-frame diagnostics.
- Known limitations and false positive or false negative observations.

## Review questions

- Does the component stream instead of batch the entire video?
- Can camera, video, and still sources share the same downstream contract?
- Does backpressure discard stale work rather than build an unbounded queue?
- Is every result explicitly provisional and linked to supporting evidence?
- Are thresholds treated as experiment configuration rather than truth?
- Are the tests repeatable without camera or network access?

## Release boundary

Sprint 001 is an internal experiment. It does not authorize production release,
App Store distribution, server deployment, model download, telemetry collection,
or collection of shopper media. Those require separate reviewed work.
