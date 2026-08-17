# SDLC2 Workflow

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
- Pablo's commit of the exact reviewed contents approves changed documentation. See [Document Review](document-review.md).
- No sprint coding may start until every governed Markdown file the sprint depends on is committed by Pablo.
- After the approved Sprint Plan Tasks define the steps, create and switch to a dedicated sprint branch before coding.
- Review the completed sprint branch and merge it into `main` through the normal Git workflow.
- Agents never create a Git commit. Pablo commits, and that act is the approval.
- Every implementation task names one approved component and modifies only that component; split cross-component work into ordered tasks with stable interfaces.
- Implementation must remain within the authorized sprint or step.
- Validate executable changes with proportionate tests and observable evidence.
- Record limitations, defects, and unfinished work instead of hiding them.
- Keep planning, implementation, testing, review, commit, merge, deployment, release, and operational evidence distinct.

## Sprint artifacts

1. The **Sprint Plan** defines the goal, purpose, stories, scope, acceptance, and exclusions.
2. Only after that plan is approved, create **Sprint Plan Tasks** with ordered component-scoped implementation work.
3. Coding begins only after Pablo has committed both artifacts.

## Completion

Work is complete only when its requested outcome and required evidence exist. A successful build alone does not prove review, deployment, release, or real-world usefulness.
