# AIShop iPhone App: Sprint 001 — Sprint Plan Tasks

Revision 2, 2026-09-20. PROPOSED; approval is Pablo's commit of this package.
Baseline: `34f246b`, the approved [plan](01-sprint-plan.md) and
[acceptance](01-sprint-plan-acceptance.md). Replaces the Simulator task sequence.

## Execution and ownership

Implement in order; write the relevant failing test, implement, then verify.
Each task owns exactly the component listed below, including its own tests.
Package components use `AIShopVision/Sources/AIShopVision/` and its test target;
app components use `AIShop/`. Only T15 edits the app project and build phases.
Integration tests exercise real Vision and production components; fixtures are
the simulated input. Pure edge-case tests supplement this integration evidence.

| Task | Component | Required result |
|---|---|---|
| T01 | VisionFeatureAdapter | Native macOS compatibility and EXIF checks |
| T02 | FixtureResources | Reference and trimmed videos available offline |
| T03 | MacIntegrationGate | One command from the first increment |
| T04 | SessionLog | Ordered JSONL and matching system-log events |
| T05 | LocalTargetCatalog | One stable banana target and cached features |
| T06 | VideoFixtureFrameStream | Incremental frames and bounded replay |
| T07 | CandidateScorer | Frozen preprocessing and fixture threshold |
| T08 | CandidateEpisodeAggregator | Provisional episodes and closure rules |
| T09 | SessionReportBuilder | Retained evidence; no source-media second pass |
| T10 | CandidateAnalysisPipeline | Shared composition, cancellation, logging |
| T11 | FixtureEvaluator | Annotation outcomes and host comparison |
| T12 | PipelineIntegrationSuite | Positive/negative and lifecycle acceptance |
| T13 | ApplicationBootstrap | Debug entry without Firebase or sign-in |
| T14 | VisionDiagnosticHarness | Replay, live feedback, report, log export |
| T15 | XcodeIntegration | Debug iPhone build; no fixtures in Release |
| T16 | iPhoneVerification | Pablo's demonstration and exported evidence |
| T17 | SprintEvidence | Reproducible results and acceptance record |

Details: [T01–T06](02a-foundation-tasks.md), [T07–T12](02b-pipeline-integration-tasks.md),
[T13–T17](02c-iphone-and-evidence-tasks.md), and [anchor](03-component-diagram.md).

## Gates and evidence boundaries

Run `./e2e/ios/run.zsh` on macOS; it invokes the package's real integration suite.
The initial probe has passed 3/3 on macOS; the video pipeline is not built yet.
The command proves the pipeline; automated app-shell coverage remains a gap.
Manual iPhone verification is mandatory and does not erase that automated gap.
Log replay reconstructs report data and image IDs; images remain separate local
evidence. A log alone cannot recreate image pixels; do not rerun source video.
Pablo commits this task revision before code changes resume. Record failed gates
and scope conflicts; acceptance remains blocked until the required phone review.
