# Sprint 008 — Independent Review

Reviewed by Codex, 2026-09-07: changes required. Proposal, not approval or deployment evidence.
Snapshot: `sprint-008-agent-upload`, HEAD `076e6e5949a69c054759a3152da690b82b81fc17`, plus unstaged/untracked changes.

## Reproduced findings

- **P2 — Retry changes the input.** `dashboard/scripts/agent.js:135` sends null context even when the last failed run was a refinement. An isolated execution of the actual action function reproduced this. Retry must preserve the failed run's note.
- **P2 — Error logs retain arbitrary path content.** `server/src/agent-api-handler.js:255` logs the raw caller-controlled path. A fake private marker in an invalid path appeared in the captured logger output. Log a route template or operation; error bodies themselves were redacted.
- **P2 — Blank refinement spends another run.** Whitespace satisfies the input's HTML `required` check; `run()` trims it and sends a bodyless request. The server permits reopening `analyzed` without context. Reject blank refinement before invoking the provider; this finding is from code inspection.
- The emulator command contacted Google Secret Manager for `demo-aishop-e2e` and received 403 responses. Its fully-offline claim is therefore false. No test-project secret was retrieved. Offline secret overrides need a scoped correction.

## Validation actually performed

- `npm --prefix server test`: **232 tests, 232 passed, 0 failed, 0 skipped** on macOS. The first sandboxed attempt failed to bind localhost; the authorized rerun passed.
- `./e2e/server/run.zsh`: **PASS steps 01–04**, exit 0, against Local `demo-aishop-e2e`. The first sandboxed attempt could not start its ports; the authorized rerun passed without code fixes.
- Step 04 persisted two failed runs with their contexts using real Firestore emulation. Concrete run timestamps did not trigger array-sentinel rejection. This proves failed-run persistence, not the successful-refinement path.
- Step 04 proved source-byte equality after upload and a second caller's empty list and 404 read/run responses. Source immutability on rerun is also supported by the runner's read-only use of the evidence store.
- Captured raw request-body strings from HEAD and the working adapter were equal without context for `targetProduct`, `areaScan`, and `areaScanCatalog`; the capture used injected fetch and made no provider calls.
- `git diff --check`: passed. Logs: `/private/tmp/sprint008-unit.log` and `/private/tmp/sprint008-e2e.log` (local, temporary evidence).

## Review conclusions and decisions

- Owner keys are SHA-256 of verified uid, computed per request; caller fields cannot replace them. Store queries and source reads are owner-scoped. No cross-owner API path was found.
- Reusing `firebase-vista-token-verifier.js` is consistent with the explicit token-verification exception: it only wraps `verifyIdToken(token, true)`. No new direct `vista-*` import or VISTA record/object access was found in the agent operations. Shared modules do retain existing transitive VISTA dependencies.
- Keep the 500-character note limit and route-before-authentication behavior. Keep the duplicated auth classifier within this sprint; a neutral shared helper would be separate work.
- Treat 25 runs as a provisional product limit, not a demonstrated Firestore size guarantee. Maximum report storage size was not qualified here.
- Retaining the prior report while refining is reasonable, but the current page renders reports only in `analyzed`, so the claimed visible-during-refinement benefit is not implemented.

## Documentation

- Replacement architecture documents are 44, 44, 44 and 46 lines. All scanned relative Markdown file links resolve; no new Markdown document carries a retired reviewer-initials field.
- The split preserves the main path and run decisions but is not purely mechanical: it omits historical built/to-build status, some descriptor detail, and the explicit allowance to ship without context UI. It adds the reopened state and context handling. Review these as edits, not a lossless relocation.
- One existing decision document remains over limit: `docs/07-planning/sprints/sprint-005/07-prompt-align-limits-to-package-definition.md`, 53 lines. Outside this sprint's correction scope; left unchanged.
- Governance still has broader wording in `sdlc2-workflow.md:15` than AGENTS.md's decision-document-only ceiling. This report is at most 50 lines; no governance edits were made.
- The delivered-scope claim that the architecture deletion is staged is inaccurate: it is unstaged in this snapshot.

## Approval and deployment state

- Plan and original tasks are committed at `7345d8c` and `cb9717b`. Added task document 05 and replacement architecture documents remain uncommitted; executable fixes await the repository's commit gate or Pablo's explicit exception.
- Pablo's supplied handoff authorizes deployment to TEST `aishop-99d36`, superseding task rule 04's deployment exclusion for this handoff. Deployment remains pending his requested commit-versus-working-tree decision and resolution of findings.
- No deployment, secret-metadata check, hosted-route smoke test, paid provider run, or signed-in browser validation was performed. A deployment from this tree would run contents no commit describes.

## Manual script after a verified deployment

1. Open the intended Hosting URL `https://aishop-99d36.web.app/agent.html` and sign in with Google. This URL has not yet been verified as deployed.
2. Upload your shelf JPEG (at most 5 MiB, 4096 px per side); expect automatic analysis and named product rows with facing counts. A failed run does not satisfy this acceptance check.
3. On an analysed row, expect Refine and no bare rerun button. Save the first counts, refine with “ignore the top shelf”, and inspect whether exclusions/counts follow that instruction; a changed answer is not guaranteed or proof of correctness.
4. If a run fails, expect a reason and Retry. After the correction, Retry of a failed refinement must retain its note. Also verify blank refinement is refused.
5. Sign out and use a fresh second Google account; expect an empty list and no access to the first account's records.
