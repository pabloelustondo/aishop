# Presentation build script

`build-presentation.mjs` deterministically generates the Web UI PowerPoint.

It uses fixed slide geometry and makes no model or network request.
Running it recreates the editable diagrams, slide text, and speaker notes.

Run from the repository root:

```bash
node 01-docs/08-low-level-design/082-web-ui/scripts/build-presentation.mjs
```

The output is written to the parent folder as
`Vision-Agent-Web-UI-Low-Level-Design.pptx`.

The script expects the bundled Codex presentation runtime.
Override `CODEX_RUNTIME_ROOT` or `CODEX_PRESENTATION_SKILL_DIR` when needed.
It does not call an LLM, image generator, web service, or repository API.
