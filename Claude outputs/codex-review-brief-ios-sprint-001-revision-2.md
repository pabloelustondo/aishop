# Review brief for Codex — Sprint 001 plan revision 2 (macOS test host)

Written by Claude on 2026-09-19 at Pablo's request. Your Task 1 stop fired
correctly: real Vision feature prints fail in the iOS Simulator. Pablo chose a
way forward and asked Claude to revise the plan. Review it before anything is
implemented.

## 1. Your role

- Reviewer only. Do not edit, stage, commit, or write code. Reply in chat.
- Findings first, ordered `Blocker`, `Major`, `Minor`, with file and line and a
  concrete failure mode. "No findings" is valid. End with one of `ACCEPT |
  ACCEPT WITH CONDITIONS | CHANGES REQUIRED | REJECT | BLOCKED`.
- Reproduce; do not trust this brief. Disagree where you disagree.

## 2. State

- Branch `codex/ios-vision-sprint-001-target-signal`, HEAD `44428d1`, fully
  pushed. Approved: plan revision 1 (`69cd288`) and Tasks (`44428d1`).
- Unstaged proposal by Claude: eleven modified documents and one new one under
  `ios/AIShop/01-docs/`. Nothing is staged. Read them with `git diff`.
- Your own uncommitted work is untouched: the `AIShopVision` package, the probe
  record, and its log. Claude verified their SHA-256 before and after editing.
- Claude did **not** touch `02-sprint-plan-tasks.md` or
  `03-component-diagram.md`. Governance creates Tasks only after the plan is
  approved, and the correction loop reapproves the plan first. Section 5 lists
  what the Tasks revision must then contain.

## 3. The decision

Pablo decided: tests that use real Vision, and the client end-to-end gate, run
natively on macOS, conditional on a macOS probe passing. Reasons:

- Your probe: `NSOSStatusErrorDomain Code=-1: Failed to create espresso context`
  on the iOS 27.0 Simulator, Xcode 27.0 (`27A5218g`).
- Apple staff, on the same error for another Vision request: expected, the
  simulator lacks the capability (Apple Developer Forums thread 757286).
- One third-party report (GitHub `missingems/Mooligan` PR 154) says feature
  prints fail this way in the simulator by default, that forced CPU computes
  different prints for the same pixels, and that macOS prints match a phone's.
  This is a single report, not Apple documentation. The revision treats it as
  unproven and adds an iPhone calibration run to settle it.
- `Package.swift` already declares `.macOS(.v14)`, so the same code and tests run
  there unchanged. Nobody has run them on macOS yet.

Rejected as the main path: forced CPU in the Simulator (numbers may not
transfer; kept only for the harness), a physical phone as the gate (not one
offline command), a bundled Core ML model (too much scope now; your
`ImageFeatureExtracting` protocol keeps it open).

## 4. What changed

| File | Lines | SHA-256 prefix | Change |
|---|---|---|---|
| `04-…/sprint-001-test-host.md` (new) | 41 | `0d3f47567eeedb7b` | The decision, why macOS, order of work, iPhone calibration, what macOS does not predict. |
| `07-…/01-sprint-plan.md` | 50 | `ae7d9dcec20571d4` | "Risk" replaced by "Test host"; fixtures go to the package tests; gates reworded for a revision. |
| `07-…/01-sprint-plan-acceptance.md` | 46 | `73c886728cc7bac5` | Harness line replaced by three lines; gate rewritten for macOS; records that the gate excludes the app shell and harness screen. |
| `02-intent/intent.md` | 28 | — | "in the iOS Simulator" becomes "on a developer machine, without a camera or a phone". |
| `01-…/context.md`, `04-…/test-strategy.md`, `04-…/sprint-001-fixtures.md`, `05-…/proof-of-concept.md`, `09-…/build-and-test.md`, `10-…/review-and-release.md`, `11-…/operational-reality.md`, `README.md` | — | — | Wording aligned; probe outcome recorded; calibration added as a measurement and as review evidence; index link. |

All files are at most 50 lines, all relative links resolve, `git diff --check`
is clean.

## 5. What the Tasks revision must contain (not yet drafted)

1. Task 1 outcome recorded: Simulator probe failed, stop fired.
2. **Task 1a, macOS probe (stop gate).** Run the existing package tests natively.
   If real Vision fails there too, stop; the test-host decision is void.
3. **Task 1b, compute device.** Make the Vision compute device adapter
   configuration; probe forced CPU in the Simulator; record the result. Never
   blocks. Decides where the harness runs.
4. **Task 1c, fixture resources.** Move `banana.JPG` and the two trimmed videos
   into the package test resources and declare them in `Package.swift`. Task 3
   needs them there. The two original `.MOV` files were committed beside them in
   `69cd288` and are not fixtures.
5. Task 4: freeze the crop-and-scale option before the threshold. The adapter
   uses `.scaleFill`, which squashes a 3:4 reference and 9:16 frames differently.
   Freeze the threshold on macOS values.
6. Task 11: fixtures are no longer added to the Xcode project.
7. Task 12: `./e2e/ios/run.zsh` runs the package tests natively on macOS and
   answers PASS or FAIL. It no longer launches the harness.
8. **Task 12a, iPhone calibration.** Needs Pablo's phone. Same sampled frames,
   distances beside the macOS values, agreement rule from the test-host document.
9. Task 13: evidence includes the macOS gate result, the Simulator failure
   record, and the calibration.
10. The Tasks file is at 50 lines today, so it must be split, not compressed.
    The diagram's "Offline iOS Simulator" subgraph and the arrow from the gate to
    the application bootstrap must change.

## 6. Scrutinise these

1. **Gate coverage.** Governance says the gate "runs the whole system end to
   end". The revised gate covers the pipeline package and records the app shell
   and harness as a gap. Is that an honest reading, or a Blocker?
2. **The agreement rule.** "Every sampled frame falls on the same side of the
   frozen threshold on both hosts." Is that testable and sufficient? Should a
   numeric tolerance be fixed as well?
3. **Disagreement blocks Sprint 002 threshold work but not Sprint 001
   acceptance.** Right severity?
4. **How the calibration actually runs.** Can a Swift package test bundle run on
   a physical iPhone with this project's signing, or must the values come from
   the harness on the phone? Say which is feasible.
5. **Harness fallback.** "On the Mac" assumes the iOS app can run as "Designed
   for iPhone" on Apple Silicon with real Vision. Claude has not verified that.
6. **Plan edited before the macOS probe has run.** The decision document says it
   is void if the probe fails. Is that ordering acceptable, or should the probe
   result be in hand before Pablo commits?
7. **Task 1 code is uncommitted** while the plan changes under it. Anything in
   the adapter that the revision invalidates?
8. Any surviving statement, in any document, that still assumes the Simulator
   runs real Vision.

## 7. Not authorised

Running the macOS probe, any code, any edit to Tasks or the diagram, any Git act.
If you think the macOS probe should run before Pablo commits this revision, say
so and let him decide; it is one command and changes no file.
