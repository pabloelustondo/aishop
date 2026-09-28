# 01 — The Agent analysis page

The hosted Agent page gives us the reason for the server-side design. A person needs
one place to submit shelf evidence, see processing state and review the saved result.
The browser presents an analysis record; it does not own the authoritative workflow.

In this capture, the left side retains the source video and its sampling summary.
The right side shows the recognition report as product names, visible facing counts
and confidence. The lower section preserves items the model could not identify.
These elements let a reviewer compare the model's claims with the evidence.

The server must keep the state durable because recognition can outlive the original
browser request. A person may refresh, close the page or return later. The page reads
the saved analysis instead of depending on an in-memory JavaScript operation.

This screenshot contains a completed video analysis. Video requires upload completion,
frame extraction and a multi-frame recognition path. This presentation narrows the
technical story to a stored JPEG and the endpoint
`POST /v1/agent/analyses/{id}/run`.

The report experience is the useful common point: the user reviews source evidence,
recognized products, counts and uncertainty. The next slides will move behind this
page and show how the photograph request becomes that durable report.

When presenting, first point to the source evidence, then the findings table and the
uncertain-items section. Close by stating that the page is a reader of server-owned
state, which is why the endpoint and background workflow matter.
