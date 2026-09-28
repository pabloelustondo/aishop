AI-MODIFIED - 2026-09-21T15:57Z

# General technical presentations and design before code

Apply [human understanding](human-understanding.md) and the shared
[review checklist](presentation-review.md) to every presentation type.

## Purpose and story

1. Name the audience, scope, and question or decision the presentation supports.
2. Start with the human purpose and one concrete input, situation, or outcome.
3. Establish the system boundary and a few responsibilities before internals.
4. Carry one example through the explanation; introduce vocabulary when needed.
5. Progress from purpose to example, components, behavior, evidence, and decision.
   Adapt this progression to the subject; it is not a mandatory slide inventory.
6. Make each slide answer one reader question. Give it a meaningful title.

## Visual language

7. Prefer real inputs, outputs, screenshots, photos, or clearly labeled mockups
   when their appearance explains the idea. Decorative imagery is insufficient.
8. Otherwise use UML 2: package/component for structure; activity/sequence for
   behavior; state machine for lifecycle; class/object for contracts and values;
   deployment for hosts. Select only the views that answer the reader's question.
9. Use portrait pages when needed; flow downward at normal reading width.
   Sequence time runs downward. Split crowded views instead of shrinking labels.
10. Use correct UML relationships, guards, boundaries, and arrow direction.
    Explain simplified notation and map short aliases to precise component names.
11. Preserve editable diagrams. Keep names, colors, units, and visual roles stable.
12. Use charts, tables, brief excerpts, or prose when they explain something better.
    Give the reason in notes. Never invent screenshots or measurements as evidence.
13. The visual carries the main explanation. Notes add reasoning and qualifications;
    fine print carries detailed evidence. Essential meaning stays visible.

## Additional rules for low-level design before implementation

14. Mark components, paths, interfaces, and behavior as proposed where applicable.
    Use planned file paths only as design choices, never as existing source links.
15. Define responsibilities, inputs/outputs, contracts, invariants, and dependencies.
    Explain material state, ownership, concurrency, errors, and resource lifetimes.
16. Walk one example through the proposed runtime, including a relevant failure path.
17. Label pseudocode and hypothetical values. Distinguish expected from measured.
18. Explain the chosen decomposition, material alternatives, and tradeoffs.
19. Map requirements to planned tests and observable acceptance; identify unknowns
    and the experiment or reviewer decision needed to resolve each material one.
20. End with what the reviewer can now decide and what remains unproven.
    A design presentation need not invent implementation files or completed tests.
