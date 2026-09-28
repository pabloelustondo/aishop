# Governance Reconciliation — 2026-08-17

Records how two branches came to hold different governance, and what was
kept. Written by Claude; awaiting Pablo's review.

## What happened

On 2026-08-13 an agent searched for `end-to-end-happy-path-gate.md` and
`environment-separation.md`, did not find them, and **wrote replacements**.

Both already existed, with Pablo's initials, on
`codex/sprint-005-vista-package-ingest`. The searches were real but looked
only at `-PROJECTS/aishop` while it sat on `sprint-004-customer-self-registration`,
and at a Codex worktree whose files were then missing. The agent concluded
"these do not exist" when the evidence supported only "I cannot find these",
and acted on the stronger claim.

The replacements were then committed to `sprint-004-customer-self-registration`,
so two branches held different rules under the same filenames.

## What was kept

| File | Kept | Why |
|---|---|---|
| `end-to-end-happy-path-gate.md` | **Original** | Pablo's, approved, and materially better: it carries the Sprint 005 lesson, concrete speed and isolation requirements, and the current gate inventory |
| `environment-separation.md` | **Original** | Pablo's, approved, and more precise on declaration, promotion, and evidence |
| `document-review.md` | **2026-08-13 rewrite** | A deliberate decision, not an accident: approval is the commit, not typed initials |
| `sdlc2-workflow.md` | **2026-08-13 revision** | Reconciled to that same decision |
| Three draft rules | Brought across | Pablo's own drafts, unrelated to the confusion |

The reconstructions are discarded. Nothing of Pablo's was overwritten.

## Consequence worth noting

The original gate document already stated that no client-side end-to-end
gate exists and that **every client sprint must record that gap**. VISTA's
client upload sprint did record it — so the work complied with a rule the
agent believed was missing. The rule was doing its job unread.

## Still owed

VISTA's own documents cite the reconstructions and describe the originals as
unlocatable. They are corrected in the same change as this record.
