# Physical-iPhone verification runbook

Status: device steps unperformed. Mac gate and synthetic comparator CLI rehearsed.
The synthetic rehearsal tests the tool, not iPhone behavior or acceptance.

## On the phone

1. Connect the phone to the Mac and open the AIShop Xcode project.
2. Select `AIShop-VisionDiagnostics`, Debug, and the actual phone as destination.
3. Run from Xcode. Confirm the offline diagnostic screen opens without sign-in.
4. Select Banana present and Run fixture. Let it finish.
5. HITL (Human in the Loop) observes possible match before the end and inspects the final report.
6. Export the session log locally. Preserve the report and images from the app container.
7. Repeat with No banana. Do not change the frozen profile.
8. Check both runs exhausted normally and report zero dropped frames.

Tapping the ordinary app icon does not supply the diagnostic launch configuration.
The harness currently offers paced replay only. If drops occur, record the blocker.
Do not hide missing frames or relabel another host as an iPhone.

## On the Mac

Run `./e2e/ios/run.zsh` from the repository root.
It prints a fresh evidence directory containing the build and fixture logs.
Use its built `build/debug/AIShopVisionEvaluate` executable.

The comparison takes these arguments, in this exact order:

```text
AIShopVisionEvaluate annotations.json --compare
  mac-positive/session.jsonl mac-negative/session.jsonl
  phone-positive/session.jsonl phone-negative/session.jsonl
```

This is the rehearsed argument order, displayed across lines for readability.
Use real paths on one command line; annotations live in the package test resources.
No real-phone comparison has yet been run.

| Exit | Meaning |
|---|---|
| 0 | All sampled-frame support decisions agree and phone outcomes pass |
| 2 | Phone outcomes pass, but decision disagreement blocks Sprint 002 threshold work |
| 1 | Invalid evidence or a failed phone outcome |

Record device, OS, build, date, evidence paths, and the HITL observation.
The HITL's commit of the acceptance record is still required.
