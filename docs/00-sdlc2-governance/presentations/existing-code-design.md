AI-MODIFIED - 2026-09-21T15:57Z

# Low-level design for a change to existing code

Use the [general](general-technical-presentations.md) and
[human understanding](human-understanding.md) standards. Apply the source
navigation and documentation rules in [walkthroughs](technical-walkthroughs.md)
to existing code. This type supports fixes, refactoring, and bounded enhancements.

## Establish the current behavior

1. Read and identify the actual baseline before proposing a change: revision,
   relevant working-tree differences, files, symbols, tests, and runtime evidence.
2. Begin with the user-visible problem or technical limitation and its consequence.
   Distinguish a reproduced failure, a design concern, and an untested hypothesis.
3. Trace one concrete case through the current code. Locate the responsible
   component and explain the cause; mark an uncertain cause as uncertain.
4. State behavior and contracts that must be preserved, plus relevant constraints.

## Explain the proposed change

5. Use CURRENT and PROPOSED labels on separate, vertically stacked or successive
   UML views. Keep the same names and visual roles; highlight only meaningful deltas.
6. Show a picture or mockup when the changed experience or output is visual.
   Label the mockup; do not present it as the implemented result.
7. Explain how the new responsibility, interaction, state, or contract fixes the issue.
   Show consequences, material tradeoffs, and why the chosen boundary is appropriate.
8. Give existing file paths and starting symbols, then a distinct planned-change map:
   add, modify, move/rename, or remove; current owner; proposed owner; reason.
9. Use short exact current-code excerpts and clearly labeled proposed code or
   pseudocode when they clarify the change. Never blend the two as one current listing.
10. Identify affected callers, public contracts, data, errors, concurrency, resource
    lifetime, performance, compatibility, or migration where materially relevant.
11. Explain the smallest coherent implementation sequence and how to recover or
    roll back when the change has meaningful migration or operational consequences.

## Show how the change will be checked

12. Map each intended correction and preserved behavior to a test or observation.
    Use characterization tests where existing behavior is unclear and consequential.
13. For a bug fix, identify evidence that fails before and should pass after.
    For refactoring, identify behavior-preservation checks; for an enhancement,
    identify the new acceptance case and affected regression checks.
14. Keep planned tests distinct from executed results. If work is already partly
    implemented, identify which proposed changes are now present in the reviewed snapshot.
15. Plan necessary source-comment changes. Existing comments describe current code;
    update them with implementation, not early to describe an unimplemented future.
16. End with open decisions, material risks, and the next verifiable step.
    After implementation, produce or update the walkthrough using measured evidence.
