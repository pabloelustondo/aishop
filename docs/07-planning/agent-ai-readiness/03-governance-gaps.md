# Governance Gaps

Rules that contradict each other, found while preparing Increment 0.

## Fixed in this change

**AGENTS.md described the retired initials mechanism.** `document-review.md`
retired `HumanReviewerInitials:` on 2026-08-13; approval became Pablo's
commit. But `AGENTS.md` was edited on 2026-08-20 and still required the
field, still told agents to clear it, and still granted sprint agents
"local commits, and pushing the sprint branch" — which the same
governance forbids outright. The newer file held the older rule.
`AGENTS.md` is rewritten to the commit model, and its own initials field
removed. The two `docs/articles/byClaude/` documents that explained the
initials mechanism as current are corrected the same way.

## Needing Pablo's decision

**`exact-hash-approval-identity.md`** is a blank-initials Sprint 006
draft built entirely on initials plus staging: "Adding initials changes
the bytes… the agent unstages, clears initials, and re-presents." Its
underlying idea — approvals identified by hash so they are checkable
across sessions — survives the retirement; its mechanism does not.
Rewrite against commits, or discard.

**`work-item-authorization.md`** is the other Sprint 006 draft, blank
and unauthoritative, defining a `NEXT_WORK_ITEM.md` pointer with `READY`
states. Increment 0 either adopts it or does not; leaving it drafted
means two ways to authorize work exist on paper.

**The 50-line rule has two scopes.** `sdlc2-workflow.md` says every
human-authored text file; `AGENTS.md`, amended 2026-08-20, scopes it to
decision documents and exempts source and evidence. The handoff repeats
the wider version. `AGENTS.md` is newer and is what this folder follows.

## No action

Ninety-two Markdown files still carry an initials field. Per
`document-review.md` these are historical record of approvals already
given and are removed as their documents are next revised. Stripping
them wholesale would erase evidence of real decisions and produce a
ninety-two-file diff carrying no information.
