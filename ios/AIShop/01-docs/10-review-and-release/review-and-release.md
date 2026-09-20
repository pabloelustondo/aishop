# AIShop iPhone App: Review and Release

## Sprint review evidence

- Diff limited to approved component-scoped tasks.
- Unit and fixture test results for positive, negative, and distractor videos.
- Physical iPhone harness demonstration witnessed by Pablo, with real Vision,
  a signal before fixture playback completes, and the final session report.
- Pablo's sprint acceptance after that demonstration, separate from test results.
- macOS gate result and the iPhone calibration record.
- Session logs from the macOS gate run and from the iPhone session.
- Best-frame, timestamp, similarity, latency, and dropped-frame diagnostics.
- Session and evaluation reports for each fixture.
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
