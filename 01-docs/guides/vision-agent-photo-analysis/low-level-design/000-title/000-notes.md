# 000 — AI Shop Agent Photo Analysis

This presentation explains the server-side recognition path for a photograph that
AI Shop has already stored. Its centre is the operation
`POST /v1/agent/analyses/{id}/run`.

We will begin with the Agent page because it gives the architecture a visible
purpose. A person uploads shelf evidence and later reviews a report containing
identified products, visible facing counts and uncertainty. The report must remain
available after the browser closes, so the server owns the analysis state.

The presentation then follows one photograph across the important boundaries:
the authenticated HTTP request, the runner, private evidence storage, request
assembly, the external GPT model, background collection and durable persistence.

The phrase “external GPT” matters. AI Shop contains a local analyzer adapter, but
the GPT model runs in OpenAI's infrastructure and AI Shop reaches it over HTTPS.
Later diagrams will keep those systems visually separate.

This deck focuses on the stored-JPEG path. Video upload, frame extraction and
multi-frame counting belong to a related pipeline and will not define this story.
