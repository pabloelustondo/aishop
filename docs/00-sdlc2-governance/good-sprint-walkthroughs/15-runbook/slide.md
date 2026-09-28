# Pattern: a runbook for manual steps

## Example: the iPhone verification session of Sprint 001

1. Connect the iPhone. In Xcode choose the `AIShop-VisionDiagnostics` scheme and
   the phone, then Run. The harness opens instead of sign-in.
2. Select "Banana present" and run it to the end. Watch for `possible match`
   before playback ends, then read the session report.
3. Export the session log with the share button.
4. Repeat steps 2 and 3 with "No banana".
5. On the Mac, run `./e2e/ios/run.zsh`. It prints the folder holding the Mac logs.
6. Run `AIShopVisionEvaluate` with `--compare`, the two Mac logs, and the two
   phone logs.
7. Read the exit code: `0` the hosts agree; `2` a threshold disagreement with the
   outcome unchanged; `1` the phone outcome failed or the evidence was rejected.
