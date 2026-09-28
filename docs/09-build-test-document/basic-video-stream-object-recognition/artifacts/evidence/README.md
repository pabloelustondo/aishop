# Captured test evidence

Snapshot: 2026-09-20. These are Mac and Simulator results, not phone acceptance.

- [Native Mac test transcript](mac-gate.log): 29 tests, no failures or skips.
- [Required-test verifier output](mac-gate-verification.log).
- [Simulator app test transcript](app-tests.log): 25 tests, no failures.
- [Positive report](mac-positive/report.json) and [evaluation](mac-positive/evaluation.json).
- [Positive session log](mac-positive/session.jsonl) and separately retained images.
- [Negative report](mac-negative/report.json) and [evaluation](mac-negative/evaluation.json).
- [Negative session log](mac-negative/session.jsonl).

The reports and JSONL files are generated production-pipeline output.
The images under `mac-positive/images/` are local fixture evidence, not product boxes.
The logs may retain original temporary build/output paths from this Mac.
Run the gate again for current evidence; the saved snapshot is not a future PASS.

## Reproduction

Run `./e2e/ios/run.zsh` from the repository root.
For the app tests, select `AIShop-VisionDiagnostics` in Xcode and run Test on Simulator.
The package gate prints its new evidence directory and validates every required test.
Do not run `calibrate-scorer.rb` as part of regression tests or phone calibration.
The compiled profile stays frozen while `AIShopVisionEvaluate` compares phone logs.

## Remaining acceptance

A signed Debug build exists. No physical-iPhone run or exported-log calibration
is included here. Pablo's observation and approval remain required.

