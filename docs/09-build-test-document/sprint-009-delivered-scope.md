# Sprint 009 — Delivered Scope

Written by Claude, 2026-09-07. Unstaged: the working tree is the proposal.

## Environment

| | |
| --- | --- |
| Base commit | `0bab4a7` |
| Runtime | Node v22.23.2 |
| Host | Linux aarch64, cloud-linked VM — **not** macOS, and no browser |

## The six tasks

| Task | Component | State |
| --- | --- | --- |
| 1 Serve the stored source | `agent-api-handler.js` | done, 3 new tests |
| 2 Own stylesheet | `dashboard/styles/agent.css` | done |
| 3 Full-width markup | `dashboard/agent.html` | done |
| 4 Upload control states | `dashboard/scripts/agent.js` | done |
| 5 Render one analysis | `dashboard/scripts/agent.js` | done |
| 6 Verification | — | partial; see below |

## Results

`npm --prefix server test`: **242 tests, 215 pass, 20 fail.** The 20 are the
same `sharp` gap across the same 18 files; no agent, handler, router, page or
hosting test is among them. `git diff --check` clean.

The coupling is gone at the source: `agent.css` contains no bare element
selector, so no other page can inherit its layout by loading it, which is the
mistake `layout.css` made. `agent.html` now loads `base.css` and `agent.css`
only.

Every element id in the markup is looked up by the script and every lookup
resolves — checked mechanically, both directions.

## One thing the plan did not anticipate

An `<img src>` cannot send an Authorization header, and the source route
requires one. The bytes are therefore fetched with the token and wrapped in a
blob URL, as `api.js` already does for VISTA artifacts. Every such URL is
revoked before the list is redrawn; without that, each refresh would leak
another copy of every photograph for the life of the tab.

## Not verified here

- **No browser.** The 1440 px and 900 px checks, keyboard traversal of the
  confidence badges, and the reviewer-dashboard comparison in
  [05-task-rules.md](../07-planning/sprints/sprint-009-agent-page/05-task-rules.md)
  are all unrun. Task 6 is delivered as code, not as evidence.
- The reviewer dashboard is argued unchanged rather than shown: `index.html`,
  `catalog.html`, `layout.css` and `components.css` are byte-identical to
  `main`, so nothing it loads changed. A screenshot pair is still owed.
- `./e2e/server/run.zsh` was not run; no `firebase` CLI here and the functions
  emulator loads `sharp`. Step 04 exercises the four original operations and
  does not cover the new source route.

## Judgement calls

1. **`components.css` was dropped too**, not just `layout.css` as the plan
   said. It describes the reviewer dashboard, and `.status` — the one class
   this page used from it — is now defined locally with a `data-state`
   variant. `.auth-card` was carried over from `layout.css` for the same
   reason.
2. **Confidence and status use `data-` attributes**, not class name suffixes,
   so an unexpected value from the model renders as a plain badge rather than
   silently unstyled.
3. **The image is lazy-loaded per card** and its failure is local: if the
   source call fails the card still shows its rows, with a line saying the
   image could not be loaded.
