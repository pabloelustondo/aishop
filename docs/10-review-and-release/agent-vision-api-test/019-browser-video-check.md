# Test 019 — Hosted Agent video check

Result: PASS for operator-reported browser upload/analysis and visible report.
Environment: TEST, https://aishop-99d36.web.app/agent.html.
Evidence: Pablo reported "it worked" and supplied a screenshot.

## Observations

The hosted page shows IMG_3381.MOV with ANALYSED status and a populated report.
Displayed metadata: 1920 × 1080, 40 seconds, 12 sampled frames, one run.
Products, facings, confidence labels and uncertainty notes are rendered.
The displayed model is gpt-5.4-mini.
This extends the direct curl evidence with an operator-reported browser success.

## Limits and open issues

The screenshot is a final state, not a recording of the upload transitions.
Automatic rendering without refresh was not separately confirmed in this message.
The video player is black and reads 0:00; successful playback is not established.
Original-source retrieval previously returned HTTP 500 and remains open.
The header still reports one upload needing attention; its record is not identified
by this screenshot, so do not assume it is the completed video or delete it.
Product identification/count accuracy still needs manual comparison with evidence.
No run ID was supplied for this browser result; do not equate it with the curl run.
This result does not close the sprint or validate cancellation/resume behavior.
