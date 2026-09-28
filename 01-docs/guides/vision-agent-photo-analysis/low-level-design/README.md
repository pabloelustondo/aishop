# AI Shop Agent Photo Analysis — Presentation Guide

## Purpose
Explain the server-side path that analyses an already stored shelf photograph for
the hosted [AI Shop Agent](https://aishop-99d36.web.app/agent.html).
The presentation starts with the page a user sees, then follows
`POST /v1/agent/analyses/{id}/run` into the server and the external GPT model.

## Scope
The central subject is the stored-JPEG run endpoint and the code required to
produce a durable recognition report. Upload, video frame extraction, Admin
operations, catalog matching and future UI work appear only when needed for context.

## Four source files for every concept
Each numbered concept contains:

1. `NNN-slide.md` with concise audience-facing slide text.
2. `NNN-visual-source.md` with the image or diagram specification and sources.
3. `NNN-visual.svg` with the rendered 16:9 visual slide.
4. `NNN-notes.md` with the detailed speaker explanation.

Bitmaps used as evidence remain in `assets/`. The final PPTX will use these
maintainable sources rather than making PowerPoint the only editable artifact.

## Current sequence

- `000-title` — presentation cover and scope.
- `01-agent-page` — the hosted page as the visible entry point.

Later concepts should proceed from the HTTP contract to orchestration, request
assembly, external GPT interaction, background collection and durable results.
