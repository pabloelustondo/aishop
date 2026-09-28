AI-MODIFIED - 2026-09-21T15:57Z

# Technical walkthroughs of implemented code

For a completed increment awaiting human code review, apply the
[general](general-technical-presentations.md) and
[human understanding](human-understanding.md) rules plus the requirements below.

## Ground the walkthrough in the actual implementation

1. Read the real source, configuration, tests, and saved artifacts before drafting.
2. Record repository, branch, sprint base, and exact reviewed revision or hashes.
   Compare committed changes, working-tree edits, and untracked files with that base.
3. Separate implemented behavior, observed results, and pending acceptance.
   A saved historical run is not a new run; identify its date, host, and inputs.

## Make navigation part of the explanation

4. Show every code-bearing folder in the declared review scope and its purpose,
   including tests, scripts, tools, and build/configuration boundaries.
5. In each folder, identify every added, modified, renamed, or deleted file.
   State its responsibility and the type, function, test, or configuration to read first.
6. Give repository-relative paths and working browser links when available.
   Pin committed links to a revision; identify a working-tree snapshot by hashes.
7. Mark unchanged neighbors and explicit scope exclusions. Use an appendix or
   file index for completeness, while keeping relevant navigation beside the concept.
8. Bridge concept to component, folder, file, symbol, then runtime data or evidence.
9. Use brief exact source excerpts only for key concepts; identify source and omissions.
   Explain the behavior around the excerpt. Avoid whole-file slides.
10. Show who creates and consumes generated artifacts and where the reviewer finds them.
    Map proving tests and meaningful failure cases to the responsible code.

## Make the code readable when opened

11. Each added or modified source file begins with a concise introduction covering
    its role, inputs/outputs, boundaries, and useful reading entry point.
12. Explain non-obvious invariants, units, state transitions, concurrency, ownership,
    errors, and important decisions near the relevant declarations or operations.
13. Describe reasons and contracts, not obvious syntax. Match actual behavior.
    Revise comments with code; remove obsolete explanations and avoid boilerplate.
14. Preserve shebangs, tool directives, licenses, and generated-file conventions.
    For generated/vendor files, document the owning source or adapter instead.

## Human review

15. Demonstrate one input through runtime interactions, state, and saved output.
16. Present test results with their provenance and limits; show unresolved issues
    and a runnable manual check where human or device validation is still required.
17. Check the file inventory against the actual diff; verify source links, symbols,
    excerpts, comment accuracy, and artifact paths before handing over the deck.
