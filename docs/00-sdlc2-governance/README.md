# SDLC2-Governance

HumanReviewerInitials: PME

This folder contains the mandatory operating rules for AI Shop's SDLC2 workflow.

## Rules

- [Document Review](document-review.md) defines Markdown approval and signature handling.
- [SDLC2 Workflow](sdlc2-workflow.md) defines how intent becomes reviewed, tested, and releasable work.
- [End-to-End Happy Path Gate](end-to-end-happy-path-gate.md) requires one always-runnable command that proves the whole system end to end, from the first increment on.
- [Environment Separation](environment-separation.md) requires every project to declare its environments before deployment and binds every deployment, evidence record, and agent authority to one named environment.
- [Diagram Readability](diagram-readability.md) makes vertically scrolling,
  readable diagrams the default and prevents horizontal-scroll dependence.
- [Presentations](presentations/README.md) defines the shared form of anything
  explained to Pablo on slides: a visual plus speaker notes, with fine print.
- [Good Sprint Walkthroughs](good-sprint-walkthroughs/README.md) defines the
  Walkthrough, the type of presentation an implementing agent prepares when a
  sprint awaits review.

Agents must read the relevant rule before changing documentation, planning a sprint, implementing code, reviewing work, or preparing a commit or release.

If a governance rule conflicts with a project document, stop and identify the conflict. Pablo decides which document should change.
