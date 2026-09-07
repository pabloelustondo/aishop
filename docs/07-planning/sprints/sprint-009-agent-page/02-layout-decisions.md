# Sprint 009 — Page Layout Decisions

Companion to [01-sprint-plan.md](01-sprint-plan.md). What
[the mockup](../../../06-solution-design-and-architecture/mockups/agent-page-full-width.html)
decided about the shape of the page. Row-level decisions are in
[03-table-decisions.md](03-table-decisions.md).

## One page, and the upload gets out of the way

Two pages were considered and rejected: an upload page has nothing to
show after you upload, so you would leave it immediately. Upload is an
action, not a destination.

So the control collapses to an **Upload another** button in the header
once any analysis exists, and expands on click. With an empty list it is
the whole page, centred, because then it is the only thing to do.

## The evidence sits beside the claim

The photograph is shown next to the rows, not above them and not behind
a link. A count is checkable only against the image it came from:
"Wine glass 2" is unreadable on its own and obvious beside the picture.

This is the half of the Agent AI audit requirement that costs almost
nothing today. Per-object boxes need coordinates the `areaScan` contract
does not return; the image does not.

It also has a price the plan names: the bytes are stored but never
served, so this needs a new read endpoint. That is the whole reason
Sprint 009 is not page-only work.

## Stacked, not master-detail

Analyses are full-width cards, newest first. A left rail listing runs is
the obvious alternative, rejected for now: a rail is a fourth thing on a
page asked to hold three, and a narrow left column is what made the
current page unreadable. Revisit when scrolling costs more than a rail.

## Retry and Refine keep their rules

Unchanged from Sprint 008 and its corrections: automatic first run;
Retry only on `failed`, carrying that run's own note; Refine only on
`analyzed`, and only with a non-blank note.

## Not decided here

Whether the previous report stays visible while a refine runs — task 7
of [06-correction-tasks](../sprint-008-agent-upload/06-correction-tasks.md).
The mockup shows no refining state.
