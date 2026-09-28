AI-MODIFIED - 2026-09-21T15:57Z

# Technical presentation standards: start here

Applies to all technical presentations, design reviews, and code walkthroughs.
This is the shared entry point for Pablo's direction of 2026-09-21.

## Choose the purpose

| Purpose | Required guidance | Reader's question |
| --- | --- | --- |
| Explain technology or design before code exists | [General and new design](general-technical-presentations.md) | What is it, why, and how should it work? |
| Review implemented code after a sprint | General + [walkthroughs](technical-walkthroughs.md) | What was built, where is it, and what proves it? |
| Design a fix or change to existing code | General + [existing-code design](existing-code-design.md) | What happens now, what must change, and how will we check it? |

All three also follow [human understanding](human-understanding.md) and the
[review checklist](presentation-review.md). Walkthroughs and existing-code
design use the source navigation and documentation rules in the walkthrough guide.

## Shared visual contract

Use a meaningful picture when appearance carries the idea. Otherwise prefer
UML 2, arranged vertically and readable at normal width without horizontal scroll.
Tables, charts, short code fragments, and prose are useful justified exceptions.
Keep the concept-to-component bridge visible before descending into details.

## Relationship to earlier guidance

These focused standards extend the earlier presentation and walkthrough patterns.
For these three purposes, this direction takes precedence over earlier guidance
that confines code navigation to fine print or assumes every design is implemented.
The earlier chapter folders remain useful examples, not a fixed slide count or order.
Repository review, implementation, and Git rules remain in their existing documents.

## Reference example

[Selected sample and how to study it](samples/README.md) explains the 35-slide
AIShop Sprint 001 deck Pablo selected. Reuse its teaching method and visual quality;
choose content and length for the new audience and task.
