# VISTA Agentic Items Vision — Presentation Guide

## Purpose
Explain the image uploader and analyser through a clear, graphical presentation.
Help the audience understand the user experience, architecture, and implementation.
Use SDLC2 as inspiration for sections, without requiring its numbering or order.
The starting agenda is in [01-intent/01-notes.md](01-intent/01-notes.md); a section may contain several concepts.
Assume the reader has read the [VISTA business overview](../VISTA-Linkedin-Overview-Presentation.pdf).
Open with [000-title](000-title/000-notes.md), the presentation cover.
Follow with [00-business-context](00-business-context/00-notes.md), a one-minute refresher using its page 2.
Then continue with [01-intent](01-intent/01-notes.md) and the technical module explanation.

## Four items for every concept
Each concept has one core message and four complementary items.

1. **Speaker notes (`.md`):** explain the concept in simple, connected prose.
   Include the reasoning, relevant details, and what the presenter should explain.
   Aim for about 50 lines; a little more is fine when it improves clarity.
2. **Text slide:** anchor the message with a clear title and a few short bullets.
   Aim for three to five bullets, each expressing one useful point.
   Keep explanations in the notes so the slide is easy to read at a glance.
3. **Visual source:** retain editable Mermaid, PlantUML, SVG, or an image prompt.
   For screenshots, retain the original capture and any annotation source.
   For reused PDF slides, keep a numbered source-reference Markdown with the page and rendering recipe.
4. **Rendered visual:** illustrate the core idea as SVG, PNG, or JPEG.
   Use diagrams, interface examples, or artistic imagery according to the message.

## Files and numbering
Give each slide concept its own folder containing all four items.
Name folders with a two-digit presentation number and a short, descriptive lowercase name.
The cover uses `000-title` and `000-` filenames so it sorts before `00-business-context`.
Use hyphens between words, for example `01-intent` or `02-shelf-photo-problem`.
Numbers follow presentation order, independent of SDLC2 step numbers.
Keep this README at the presentation root; repeat the slide number in every item filename for easy review.

- `01-intent/01-notes.md` — speaker notes.
- `01-intent/01-slide.md` — title and bullet content for the text slide.
- `01-intent/01-visual.mmd` — diagram source; alternatives include `01-visual.puml`, `01-visual.svg`, or `01-visual-prompt.md`.
- `01-intent/01-visual.svg` — rendered visual; use `01-visual.png` or `01-visual.jpg` when appropriate.

The slide Markdown is the editable source for an eventual PowerPoint-style slide.
A directly authored SVG can serve as both source and rendered visual in one file.
Retain artistic prompts, but do not expect them to reproduce an identical image.

## Format strategy
Default to Markdown for text, Mermaid for simple diagrams, and SVG for diagram output.
Use PlantUML for detailed UML and custom SVG when precise visual composition helps.
Use bitmaps for screenshots, photographs, and artistic images; keep labels editable where practical.
Maintain one authoritative source per visual and regenerate its output after changes.

## Working sequence
1. Choose the concept, its core message, and its place in the story.
2. Draft the speaker notes and the simple bullet slide.
3. Describe the intended visual briefly in the speaker notes.
4. Review and clarify the text with Pablo before creating the image.
5. Create the visual source and render it using the agreed visual direction.
6. Inspect the render for readability and check that all four items agree.

## Style and accuracy
Use plain language and introduce technical terms when they become useful.
Use a consistent 16:9 visual format, readable labels, colours, and component names.
Show clear boundaries and labelled arrows when explaining architecture or data flow.
Build understanding progressively; split a concept when it carries too many ideas.
Ground implementation claims in the code and distinguish intended behaviour from evidence.
Label future capabilities, illustrative examples, and deployment status accurately.
Keep this README as the authoring guide, separate from audience-facing slide content.
