# Sprint 003 — Sprint Plan Tasks

HumanReviewerInitials: PME

## Purpose

Translate the approved Sprint Plan into ordered, component-scoped implementation tasks.

## Governing artifacts

- [Sprint Plan](01-sprint-plan.md)
- [Target-selection defect](02-iphone-defect-target-product-selection.md)
- [Component architecture](../../../06-solution-design-and-architecture/components/component-architecture.md)

## Ordered implementation tasks

1. **Inspection API** — Define and test submission contracts for original JPEG bytes, scan mode, app version, and normalized target position.
2. **AI Analysis Adapter** — Make Target mode analyze the indicated position, preserve Area mode behavior, and add the distractor regression test.
3. **Mobile Capture Client** — Preserve captured JPEG bytes, submit the approved contract, and retain clear analysis and failure states.
4. **Evidence Store** — Compute SHA-256 and store exact original bytes privately under unique, non-overwriting object paths.
5. **Inspection Record Store** — Persist scan metadata, immutable initial findings, failures, status, and append-only human review events.
6. **Evidence Store** — Retrieve exact original evidence by scan ID through a private server-only operation, with missing-object tests.
7. **Inspection Record Store** — Query pending and recent inspections, detail, and append-only review history without mutating initial findings.
8. **Inspection API** — Orchestrate authentication, evidence storage, AI analysis, inspection persistence, and protected evidence retrieval.
9. **Inspection API** — Provide authenticated reviewer list, detail, and disposition operations with identity and server timestamps.
10. **Review Dashboard** — Deliver authenticated pending/recent lists, detail, scaled preview, original access, findings, notes, and dispositions.
11. **Inspection API** — Distinguish and test upload validation, evidence storage, AI analysis, record persistence, authorization, and review failure responses without exposing internal details.
12. **Inspection Record Store** — Provision the live Firestore database in Toronto and its required reviewer-query index, then verify empty-queue access.
13. **Evidence Store** — Provision the private, uniform-access evidence bucket in Toronto and verify exact-byte server access without public exposure.
14. **Inspection API** — Accept standards-compliant physical-iPhone JPEG encodings while retaining malformed and truncated image rejection with a regression fixture.

## Task rules

- Execute tasks in order unless an approved revision changes the sequence.
- Each task may modify only its named component and its component-owned tests.
- A discovered cross-component change becomes separate ordered tasks before implementation.
- Completing one task does not authorize commit, deployment, release, or the next sprint.

## Validation

After the implementation tasks, perform read-only cross-component validation against every Sprint Plan acceptance criterion. Any required fix becomes a new component-scoped task and requires renewed approval before coding.

Coding begins only after this exact document is human-approved and fully staged.
