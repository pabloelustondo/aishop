# SDLC2 Workflow

HumanReviewerInitials:PME

## Purpose

Move from intent to operational learning through small, traceable, human-reviewed increments.

## Lifecycle

The twelve lifecycle areas and their navigation are maintained in the [SDLC2 Documentation index](../README.md). Each folder owns its type of decisions and evidence.

## Working rules

- Add a focused document when a requirement introduces a distinct concern.
- Update an existing document only when the new decision makes it inconsistent.
- Keep each human-authored text file at or below 50 physical lines.
- A sprint plan defines scope; Pablo's explicit authorization starts its implementation.
- Documentation may be drafted and revised before human review.
- Human approval of changed documentation requires registered initials and staging of the exact reviewed contents.
- No sprint coding may start until every governed Markdown file is human-approved and every changed governed Markdown file is fully staged.
- Do not create a Git commit while any governed Markdown file is unapproved or has unstaged changes.
- Every implementation task names one approved component and modifies only that component; split cross-component work into ordered tasks with stable interfaces.
- Implementation must remain within the authorized sprint or step.
- Validate executable changes with proportionate tests and observable evidence.
- Record limitations, defects, and unfinished work instead of hiding them.
- Keep planning, implementation, testing, review, commit, merge, deployment, release, and operational evidence distinct.

## Sprint artifacts

1. The **Sprint Plan** defines the goal, purpose, stories, scope, acceptance, and exclusions.
2. Only after that plan is approved, create **Sprint Plan Tasks** with ordered component-scoped implementation work.
3. Coding begins only after both artifacts are human-approved and fully staged.

## Completion

Work is complete only when its requested outcome and required evidence exist. A successful build alone does not prove review, deployment, release, or real-world usefulness.
