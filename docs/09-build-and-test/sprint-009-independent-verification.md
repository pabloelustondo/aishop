# Sprint 009 — Independent Verification

Codex, 2026-09-07. Reviewed `c3e55f3`; corrections below are uncommitted.
Environment: macOS, Local `demo-aishop-e2e`, headless Chrome with synthetic UI data.
This records implementation and local validation, not deployment or recognition QA.

## Acceptance checked

- At [1440 px](sprint-009-browser-evidence/sprint009-agent-1440.png), the analysis body is 1358 px wide and the source image sits beside the product/count/confidence table.
- At [900 px](sprint-009-browser-evidence/sprint009-agent-900.png), the image stacks above the table; no horizontal overflow, including while evidence tooltips have keyboard focus.
- Keyboard Tab reaches the confidence badge and reveals its evidence text. Synthetic uncertainty descriptions/reasons and two run notes render in their respective sections.
- With an existing analysis, upload controls collapse to the header button. These screenshots use fabricated report/count/history data and the supplied tabletop photo; they are not model results.
- Real emulator source-route checks: owner's bytes equal uploaded JPEG, cache policy is `private, no-store`, unauthenticated caller gets 401, another owner gets 404.

## Defects found and corrected

1. Source route returned 503 for another owner's image, contradicting the approved 404 contract. Existing unit test incorrectly expected 503. The handler now checks the owner-scoped analysis record before reading storage; missing analysis is 404, existing analysis with unavailable storage remains 503.
2. At 900 px the tooltip's left anchor extended content beyond the viewport. Removed that responsive override, retaining right anchoring. Reproduced overflow before the fix; keyboard-focused and unfocused layouts now fit.

## Reviewer dashboard comparison

- Signed-out [main](sprint-009-browser-evidence/sprint009-reviewer-main.png) and [current](sprint-009-browser-evidence/sprint009-reviewer-current.png) screenshots are byte-identical.
- Synthetic signed-in empty-queue screenshots for [pre-sprint 0bab4a7](sprint-009-browser-evidence/sprint009-reviewer-signed-0bab4a7.png) and [current](sprint-009-browser-evidence/sprint009-reviewer-signed-current.png) are byte-identical.
- Signed-in [main](sprint-009-browser-evidence/sprint009-reviewer-signed-main.png) differs because earlier work already added VISTA UI. The claim that reviewer files are byte-identical to main is false; they are unchanged by Sprint 009. Do not undo earlier features to manufacture main equality.
- Removing `components.css` is technically consistent with isolated agent styling; its necessary status styles are local. The committed deviation does not modify reviewer assets.

## Commands and results

- Initial `npm --prefix server test`: 256/256 passed. After the missing-source correction: **257/257 passed**, zero failures/skips.
- Handler test was RED after correcting its expected contract, then GREEN: 24/24.
- All five emulator steps passed with supplemental source-route assertions. The initial supplemental run failed on 503 versus 404; the corrected run passed.
- The normal launcher was reproduced through a temporary wrapper with the extra assertions inserted into step 04; the tracked step 04 remains unchanged and does not yet retain those source checks.
- Browser checks passed at 1440 and 900 px, with no page errors. They mock Firebase identity and API data; they do not prove live sign-in or provider behavior.
- `git diff --check`: passed. Temporary logs/scripts: `/private/tmp/sprint009-unit.log`, `/private/tmp/sprint009-e2e.log`, `/private/tmp/sprint009-browser.log`, `/private/tmp/sprint009-browser.cjs`, `/private/tmp/sprint009-step04.mjs`.

## Remaining boundary

- Review and commit the handler/test and stylesheet fixes before deploying an exact corrected commit.
- Signed-in live upload/refinement, touch-specific interaction, populated reviewer detail states and HTTP image-failure feedback were not exercised in this pass.
- The original delivered-scope counts leave seven tests unaccounted for: 242 total minus 215 pass and 20 fail. They may be the zsh-dependent skips, but that Linux run was not reproduced; use the actual Mac totals above.
- No deployment, paid provider call, commit, push or merge was performed by Codex in this pass.
