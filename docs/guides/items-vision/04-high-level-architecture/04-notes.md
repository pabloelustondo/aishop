# 04 - Shared Vision Architecture

This is the first architecture map after the benchmark and test-strategy section.
Keep it at system level. Endpoint contracts and worker internals come later.

## Three entry paths
AI Shop iPhone supports a shopper looking at a product or shelf.
Its earlier path can process an image on the phone and request server-side AI.
The phone does not hold the provider credential.
This path has its own interface and shopping-oriented result.

The web Vision Agent is the more robust current manual shelf-analysis entry.
An authorised person uploads a photograph or video through `agent.html`.
The page shows progress and a saved report of products, visible facings, and uncertainty.
The screenshot on this slide is a recorded QA fixture, not a live acceptance claim.

The separate VISTA iPhone app is intended to capture inspection evidence in stores.
The shelf photograph illustrates the inspection input, not a completed iPhone integration.
Do not imply a proven end-to-end VISTA-to-Agent route.

## Shared foundation
The reusable server responsibilities are secure intake, evidence handling,
AI coordination, recorded status, and report retrieval.
The server verifies access and keeps provider credentials away from clients.
For the Agent, source media is private and Firestore stores analysis state and results.
Video analysis prepares representative frames and treats them as one shelf scan.
Background tasks and provider collection can continue after the page refreshes.
The web page reads that durable server state rather than owning the long-running work.

The older iPhone route and the newer Agent route do not have to share one URL,
payload contract, prompt, or record type to share architectural capabilities.
AI Shop aims at a shopping decision. VISTA aims at inspectable shelf evidence.
Human review remains important because image recognition and counts can be uncertain.

## What the diagram means
Solid connectors mark paths described by current project evidence.
The dashed VISTA connector marks intended integration.
The lower rail is a responsibility map, not a literal request trace.
It does not claim that every path already uses every Agent-specific service.

## Source anchors
- `docs/06-solution-design-and-architecture/high-level-architecture.md`
- `docs/06-solution-design-and-architecture/components/component-architecture.md`
- `docs/guides/vision-agent-api/01-architecture.md`
- `docs/guides/vision-agent-api/12-architecture-implementation.md`
- `docs/guides/items-vision/02-user-journey/02-notes.md`
- `docs/09-build-and-test/sprint-009-browser-evidence/sprint009-agent-1440.png`
- `docs/TesstData/WhatsApp Image 2026-09-06 at 14.41.26.jpeg`
