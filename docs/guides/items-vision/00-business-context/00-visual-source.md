# 00 — Visual Source

Source: [VISTA LinkedIn overview presentation](../../VISTA-Linkedin-Overview-Presentation.pdf).
Selected page: 2 (one-based), with original footer number 02.
Title: “Teams need to understand what is happening across stores”.
Output: `00-visual.png`, an unchanged render of that page.

## Why this page
Real shelf photographs make the user problem concrete before the architecture.
The three questions explain the business intent without requiring technical context.
Retain the photographs, labels, attribution, and original page number.

## Reproduce from the repository root
```sh
pdftoppm -f 2 -l 2 -singlefile -scale-to 1600 -png \
  docs/guides/VISTA-Linkedin-Overview-Presentation.pdf \
  docs/guides/items-vision/00-business-context/00-visual
```

This file is the textual source reference and rendering recipe.
The linked PDF is the authoritative visual source; its layout is not editable here.
For future visual edits, obtain the original editable slide or create an explicit adaptation.
