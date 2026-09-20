# Sprint 001 Tasks — iPhone and Evidence

Part of the proposed [task revision](02-sprint-plan-tasks.md); same approval gate.

## T13 — ApplicationBootstrap

Own app entry and startup tests; choose Debug harness before any Firebase/Auth init.
Preserve ordinary startup; Release must reject/omit the diagnostic launch route.

## T14 — VisionDiagnosticHarness

Own the Debug UI and its state tests; select bundled fixtures and run real T10.
Show paced playback, `possible match`, scores/metrics, stop, retained images, report.
Export the session log locally without network; no second pass or hidden retuning.

## T15 — XcodeIntegration

Own project/scheme metadata and resource-copy build steps; link the shared package.
Add T13/T14 and their tests; copy only approved fixtures for Debug builds.
Build iPhone Debug and Release; inspect Release for absent fixtures/harness routes.

## T16 — iPhoneVerification

Run both fixtures on a physical iPhone after macOS integration passes; Pablo sees
the actual harness. Export logs/report; use T11 to compare the same sampled frames.
Follow the approved [phone outcome rules](../../../04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md).
An unavailable device means pending acceptance, never a substituted Mac result.

## T17 — SprintEvidence

Own the delivered-scope report: commands, build/profile/host identities, logs,
reports, separate local images, failures, limitations, and automated app E2E gap.
Check whitespace, links, and decision-document lengths; retain independent-review
reproduction steps. Pablo's later commit of the phone-reviewed report is acceptance.
