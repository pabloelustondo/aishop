AI-MODIFIED - 2026-09-21T15:57Z

# Authoring and review checks

Use with the [presentation standards](visual-code-review.md).
These checks guide quality; they do not add commit or release approval mechanisms.

## Before authoring

- Identify presentation purpose, audience, review question, scope, and code maturity.
- Read the relevant rules and the [selected sample](samples/README.md).
- Gather the exact sources and evidence; distinguish present, proposed, and unknown.
- Outline the human story and one example before selecting diagrams or slide layouts.

## Inspect every rendered page

- The main idea is understandable from the visual and its brief labels.
- Pictures explain appearance; UML explains structure or behavior. Exceptions earn space.
- The path from concept to technical detail is gradual and explicit.
- Diagrams scroll vertically at normal width; labels and arrows remain readable.
- UML notation, direction, guards, boundaries, and message order match the source or design.
- No clipping, accidental overlap, misleading crop, or unreadable fine print remains.
- Names, colors, units, and current/proposed labels stay consistent across pages.
- Notes explain reasoning; essential meaning and required navigation remain visible.
- Links open their intended sources; shared decks do not rely on local Mac paths.
- Evidence identifies source, inputs, revision, host, and date where relevant.
- Source diagrams, notes, and editable presentation artifacts remain available.

## Check the purpose-specific evidence

- General explanation: the reader can state the purpose, boundaries, and mechanism.
- Design before code: proposed contracts, responsibilities, examples, and test intent
  are explicit; invented implementation or test success is absent.
- Walkthrough: all scoped code folders and changed files have roles and navigation;
  source introductions are accurate; behavior, tests, outputs, and limits are traceable.
- Existing-code design: current evidence, cause or hypothesis, proposed changes,
  preserved behavior, affected files, and verification are visibly separated.

## Rehearse the human review

Read the deck at ordinary width without relying on the author's memory.
Can the reviewer explain why it exists, follow one example, locate the owner,
inspect the evidence or proposed contract, and identify what remains unresolved?
If not, repair that missing bridge before adding more content or decoration.

Use the sample as a quality reference, not a requirement for 35 slides.
A shorter explanation is better when it preserves meaning and verifiability.
