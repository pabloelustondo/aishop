# Vision Agent web UI

## Purpose
This slideshow explains the static browser client hosted from `02-web-ui/`.
It focuses on the Vision Agent while showing its neighboring web applications.

## Slide sequence
1. [`00-title`](00-title/README.md) — presentation scope.
2. [`01-hosting-boundary`](01-hosting-boundary/README.md) — browser/server boundary.
3. [`02-page-map`](02-page-map/README.md) — four hosted applications.
4. [`03-agent-page-components`](03-agent-page-components/README.md) — Agent composition.
5. [`04-authenticated-request-flow`](04-authenticated-request-flow/README.md) — secure calls.
6. [`05-upload-observation-lifecycle`](05-upload-observation-lifecycle/README.md) — UI lifecycle.

## Three slide sources
Each concept contains `*-slide.md`, `*-notes.md`, and `*-visual-source.md`.
The slide is concise, the notes carry explanation, and the visual source specifies a diagram.
Brief concept READMEs provide navigation and do not replace those three sources.

## Deterministic build
[`scripts/build-presentation.mjs`](scripts/build-presentation.mjs) builds the
editable PowerPoint without an LLM or network request. Generated images can be
added as local inputs while slide assembly remains deterministic.

Direct code orientation is available in [`02-web-ui/README.md`](../../../02-web-ui/README.md).
Every Markdown file in this package stays at or below 50 physical lines.
