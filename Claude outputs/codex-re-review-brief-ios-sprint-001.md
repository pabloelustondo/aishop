# Re-review brief for Codex — AIShop iPhone Sprint 001 (Candidate Target Signal)

Written by Claude on 2026-09-19 at Pablo's request. You drafted this sprint's
documents. Claude reviewed them, then Pablo asked Claude to amend them. Pablo
now wants your independent re-review of the amended set before he commits.

## 1. Your role

- You are the reviewer here, not the implementer. Do not edit, stage, commit,
  or write code. Reply in chat; create no files unless Pablo asks.
- Read `AGENTS.md` and `docs/00-sdlc2-governance/` first. They bind this work.
- Reproduce evidence yourself. Do not trust Claude's claims below; each one
  names where to check it.
- Report findings first, ordered `Blocker`, `Major`, `Minor`, each with file
  and line and a concrete failure mode. "No findings" is a valid result.
- End with one recommendation from: `ACCEPT | ACCEPT WITH CONDITIONS |
  CHANGES REQUIRED | REJECT | BLOCKED`. (That vocabulary comes from the draft
  rule `independent-review-and-disposition.md`. It is used here as a format
  only; the rule itself is not yet authoritative.)
- Disagree where you disagree. Several changes below are Claude's judgement
  written on Pablo's behalf, and section 6 lists them for that reason.

## 2. Repository state

- Branch `codex/ios-vision-sprint-001-target-signal`, HEAD `70eca0f`
  ("sprint 01", Pablo). One commit ahead of `dev` (`cbc68ad`). Not pushed.
- `70eca0f` holds the original iPhone documentation set under
  `ios/AIShop/01-docs/`, including the original plan. By the commit-is-approval
  rule that original plan is approved.
- Everything in section 4 is an **unstaged proposal** in the working tree.
  Nothing is staged. The Sprint Plan Tasks document does not exist yet.
- Review with `git diff` for the seven modified files, and read the three new
  files and the fixtures directly (they are untracked, so `git diff` omits them).

## 3. What Claude found in the original set

Each finding led to a change in section 4 unless marked open.

1. **End-to-end gate not mentioned.** `end-to-end-happy-path-gate.md` requires
   a Sprint Plan for observable behaviour to name the end-to-end suite it
   extends or record why none applies, and says every client sprint records
   that no client-side gate exists. The original plan was silent. Root Sprint
   015's plan does name `./e2e/server/run.zsh`.
2. **Fixtures required by acceptance but absent from scope, and not in the
   repo.** Acceptance needed positive, negative and distractor videos plus a
   reference image. None existed under `ios/`.
3. **Diagnostic harness required by acceptance but absent from scope, with no
   entry point.** `AIShopApp.swift` calls `FirebaseApp.configure()` and shows
   `AuthScreen` until sign-in. A harness inside that flow contradicts "without
   camera or network access". Precedent for a debug path:
   `DebugReportPreview.swift` reads the `AI_SHOP_PREVIEW_REPORT` environment
   variable.
4. **Two acceptance criteria imprecise.** "A similar-product distractor records
   evidence without being called confirmed" could not fail, because
   `component-contracts.md` says Sprint 001 cannot emit `confirmed`. "No
   accepted candidate signal" used "accepted", which no document defined.
5. **Governance scope does not cover these docs (open).**
   `document-review.md` scopes itself to Markdown at the repository root and
   under `docs/`, and excludes Markdown elsewhere "unless governance explicitly
   adds it". `AGENTS.md` scopes the 50-line rule to `docs/00-`–`docs/08-`. The
   iPhone docs live in `ios/AIShop/01-docs/`. Their README asserts governance
   applies, but a project document cannot extend governance.
6. **Unverified technical premise.** The sprint assumes
   `VNGenerateImageFeaturePrintRequest` runs in the iOS Simulator. Other Vision
   requests fail there with "Could not create inference context" because the
   simulator exposes only a CPU compute device (Apple Developer Forums threads
   764948 and 696714). Claude found no report either way for feature prints.
7. **No output defined for the end of a session.** The plan retained episode
   evidence but specified no report and no rule for closing an episode on a
   stream that never ends.
8. **Project-structure facts that will shape Tasks (open).**
   `project.pbxproj` is hand-maintained (`objectVersion = 56`, synthetic IDs,
   explicit file references), so every new file edits that shared file, which
   strains the one-component-per-task rule. The test target's Resources phase
   is empty. Tests are hosted in the app (`TEST_HOST`), so they launch Firebase.
   No approved iPhone component list exists to write tasks against.
9. **Minor (open).** `google-drive-working-tree-sync.md` is a sync probe now
   committed as approved: it carries an `AI-MODIFIED` header, describes itself
   as untracked, is missing from the README index, and is repo-wide in subject,
   not iPhone-specific. "Sprint 001" now exists in both `docs/07-planning/` and
   the iPhone docs; only the branch name tells them apart.

## 4. What Claude changed

All paths are under `ios/AIShop/01-docs/`. SHA-256 prefixes let you confirm you
are reading the same bytes (`shasum -a 256 <file>`).

| File | Status | Lines | SHA-256 prefix | Change |
|---|---|---|---|---|
| `07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md` | modified | 50 | `14cd5d9225f0c40f` | Scope gains fixtures, debug harness, episode-closing rule, session report with no second pass. Out of scope gains product crops, merging episodes into unique items, reprocessing after stop. New "Controlled limitations" (banana as probe) and "Risk" (simulator) sections. Acceptance moved out. |
| `07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan-acceptance.md` | new | 40 | `f63c88fc318d4363` | Acceptance rewritten against annotated zones and defined terms. Distractor made measurement-only. End-to-end gate statement. |
| `04-benchmarks-test-strategy-and-success-criteria/sprint-001-fixtures.md` | new | 45 | `eff5dff1141f9b6b` | Fixture files, origin, trimming, annotation table, zone rules, known properties. |
| `08-specifications-as-code/session-report.md` | new | 34 | `63826a84f8f305a9` | `SessionReport`, tests-only `EvaluationReport`, best-frame retention. |
| `08-specifications-as-code/component-contracts.md` | modified | 44 | `8bd9dc797ab8dab4` | Gap/stop/end-of-stream closing rule; "Signal vocabulary" section; note that `similarity` is a score derived from a distance. |
| `04-benchmarks-test-strategy-and-success-criteria/test-strategy.md` | modified | 38 | `7bc2dd553266650b` | Link to fixtures record; distractor measurement-only; "accepted signal" wording replaced. |
| `05-viable-proof-of-concept/proof-of-concept.md` | modified | 35 | `9366e3ac80704899` | Simulator premise recorded as unverified; first task is a probe with a stop condition; distance vs similarity. |
| `09-build-and-test/build-and-test.md` | modified | 31 | `1659ca705704861e` | Harness shows the session report; opens through a debug-only path needing neither sign-in nor network. |
| `10-review-and-release/review-and-release.md` | modified | 25 | `018752ac239e9c51` | Review evidence gains session and evaluation reports. |
| `README.md` | modified | 34 | `51abcfff6a2e95fb` | Index links to the two new lifecycle documents. |

The plan was split in two because the additions exceeded the 50-line limit.
The `02-` prefix was left free for the Tasks document. Claude checked that every
file is at most 50 lines and that every relative link resolves.

Not changed, deliberately: `AGENTS.md` and everything in
`docs/00-sdlc2-governance/` (they need Pablo's explicit instruction), and
`google-drive-working-tree-sync.md`.

## 5. Fixtures

In `ios/AIShop/AIShopTests/`, untracked, supplied by Pablo on 2026-09-19.

| File | Role | Facts | SHA-256 prefix |
|---|---|---|---|
| `banana.JPG` | Reference image | 5712×4284, EXIF orientation 6, one banana on a wood table | `bfa0e47d6025a274` |
| `video_with_banana_trimmed.mov` | Positive | 27.5 s, 826 frames, H.264 1080×1920, 30 fps, no audio, upright, no rotation flag | `1f4dfcf6f3e02cd3` |
| `video_without_banana_trimmed.mov` | Negative | 13.0 s, 390 frames, same format | `93fda716a48cc5e0` |
| `video_with_banana.MOV` | Original, not a fixture | 39.3 s, 78 MB, rotation −90, audio, GPS metadata | `3558f16ab27e154d` |
| `video_without_banana.MOV` | Original, not a fixture | 18.3 s, 36 MB, same | `f5f424f6ad1588e8` |

Claude produced the trimmed files with ffmpeg 4.4.2:

```
ffmpeg -ss 10.0 -to 37.5 -i video_with_banana.MOV    -map 0:v:0 -an -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart -f mov video_with_banana_trimmed.mov
ffmpeg -ss 0.5  -to 13.5 -i video_without_banana.MOV -map 0:v:0 -an -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart -f mov video_without_banana_trimmed.mov
```

ffmpeg's default autorotation baked the −90° rotation into the pixels. Pablo
decided the location metadata did not matter; re-encoding dropped it anyway.
Pablo is expected to delete the two originals himself. No distractor exists.

Annotation of the positive fixture, set by Claude from frames sampled at 1 fps
and at 4 fps around each boundary:

| Interval (s) | Visible | Zone |
|---|---|---|
| 0–10.0 | Thermos, gourd, laptop, table; no banana | False positive |
| 10.0–11.0 | Sliver of banana at the left edge | Do not care |
| 11.0–15.2 | Table only | False positive |
| 15.3–18.2 | Sliver of banana at the bottom edge | Do not care |
| 18.3–27.5 | Whole banana, largest at 23–26 s | Expected interval |

The whole negative fixture is a false-positive zone.

## 6. Decisions Claude wrote on Pablo's behalf — scrutinise these

1. **This sprint creates the first client-side end-to-end gate**, instead of
   only recording the gap. The acceptance file also states that the hosted test
   app configures Firebase with real project settings, which conflicts with the
   gate's offline-safe requirement, and leaves the fix to Tasks.
2. **The distractor is measurement-only** and never blocks acceptance. Is that
   the honest reading of what whole-frame similarity can do, or does it weaken
   the sprint too far?
3. **No second pass after stop.** The session report is built from evidence
   retained while streaming, on the grounds that a live camera has no file to
   revisit and the intent demands a source-independent pipeline. A ring buffer
   is noted as a later option.
4. **The banana is a pipeline probe** that does not bring Sprint 009 produce
   handling into scope, although the use cases say "packaged product".
5. **The annotation is fixed before any threshold is chosen** and never adjusted
   to fit results.
6. **The harness uses a debug-only launch path** needing neither sign-in nor
   network; mechanism left to Tasks.
7. **Fixture origin statement**: "Filmed by Pablo on an iPhone 17 on
   2026-09-19, per file metadata; his own footage."
8. **The plan is two files.** Governance speaks of "the Sprint Plan". Is a
   split plan, approved by one commit, consistent with it?

## 7. What to verify independently

- Each governance quotation in section 3 against the governance files.
- `AIShopApp.swift`, `DebugReportPreview.swift`, and `project.pbxproj`
  (`TEST_HOST`, empty test Resources phase, `objectVersion`) for findings 3 and 8.
- Line counts (`wc -l`) and relative links in all ten documents.
- The fixture facts with `ffprobe` or AVFoundation, and the annotation
  boundaries by stepping through the positive fixture yourself. You have a Mac
  with QuickTime and Xcode; Claude had only ffmpeg in a Linux sandbox.
- Internal consistency: the vocabulary in `component-contracts.md`, the zones in
  `sprint-001-fixtures.md`, and every acceptance line must use the same terms.
  Look for any surviving "accepted signal" or undefined state.
- Whether each acceptance line is deterministically testable. Two to press on:
  "Analysis begins before the complete fixture video is consumed" (what is the
  observable?) and "opens a candidate episode inside its expected interval"
  (does opening after N consecutive supporting frames interact badly with the
  18.3 s boundary and the chosen sample rate?).
- Whether the false-positive zone 0–10 s is fair, given the reference image is
  mostly the same wood table. Table-heavy frames may score close to it by
  construction. Is a threshold that separates them plausible, and if not,
  should the plan say what happens then?
- Threshold circularity: the threshold will be chosen on the same two videos
  that serve as acceptance. The test strategy calls the set "an engineering
  probe". Is that disclosure enough?
- Anything Claude missed. You wrote the original set and know its intent.

## 8. Not authorised by this brief

- Any code, including a throwaway probe of feature prints in the Simulator. It
  would settle finding 6 quickly, and you are the only agent with Xcode, but
  coding is gated on Pablo's commit of the plan and of a Tasks document. If you
  think a probe outside the repository is worth doing first, say so and let
  Pablo decide.
- Any edit to `AGENTS.md` or governance. If you agree with finding 5, propose
  the exact wording in your reply and stop.
- Any Git act that publishes or rewrites.

## 9. Questions for the Tasks document, for your opinion only

- Should the vision pipeline live in a local Swift package? It would avoid both
  the hand-edited `project.pbxproj` and the Firebase-hosted test app, and would
  make the offline-safe gate straightforward.
- What is the approved iPhone component list? Claude's candidate set: catalog
  store, `VideoFixtureFrameStream`, frame sampler with backpressure, feature
  extractor behind a protocol, scorer, `CandidateEpisodeAggregator`, pipeline
  orchestrator, session and evaluation report builders, diagnostic harness UI.
- Where should fixtures live, and should the annotation also exist as a
  machine-readable test resource beside them?
