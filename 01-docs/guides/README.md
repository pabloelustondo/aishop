# Guides and Presentations

This area contains developer guides, architecture explanations, reports, and
presentation source packages. A guide may remain Markdown or PDF when slides
would not improve comprehension.

## New presentation-style guides

New slide presentations use one self-contained folder. The folder contains a
README, numbered slide folders, deterministic build tooling, and final exports.
Each numbered slide folder carries four maintained slide artifacts:

1. `NN-slide.md` — concise text visible on the slide.
2. `NN-notes.md` — speaker notes and detailed explanation.
3. `NN-visual-source.md` — reproducible visual specification.
4. `NN-visual.svg` or `NN-visual.png` — rendered slide visual.

Every folder also has a brief `README.md` that explains its purpose. Assets
used only by one slide stay inside that slide folder.

## Build and export

- A deterministic script builds the deck without additional LLM generation.
- The final `.pptx` lives in the presentation's folder or its `artifacts/`
  subfolder, beside the maintained slide sources.
- A `.pdf` export may accompany the PPTX or remain the primary format for a
  document-style guide or report.
- Temporary candidates, renders, inspections, and validation files belong in
  ignored `.codex-build/` storage, not a shared root `output/` folder.

Existing legacy presentations do not need conversion solely to satisfy this
convention. Apply it when creating a new guide or materially rebuilding one.
