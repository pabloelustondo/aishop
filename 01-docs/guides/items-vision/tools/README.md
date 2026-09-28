# Presentation tools

This folder contains maintainable tooling owned by the Items Vision guide.

`build-presentation.mjs` reads every numbered concept, creates text and visual
slides, attaches speaker notes, validates the package, and writes the final PPTX.
It uses the centrally bundled Codex presentation and image runtimes.

`check-structure.mjs` requires a README in every folder and enforces the
50-physical-line limit for every Markdown file in this package.

Run from the repository root:

```bash
node 01-docs/guides/items-vision/tools/build-presentation.mjs
node 01-docs/guides/items-vision/tools/check-structure.mjs
```

Set `ITEMS_VISION_FINAL_PATH` to test a different output path.
Temporary candidates and validation records go to the ignored `.build/` folder.
