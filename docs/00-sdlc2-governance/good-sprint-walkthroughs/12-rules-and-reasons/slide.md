# Pattern: rules and reasons

## Example: design decisions of iPhone Sprint 001

| Rule | Reason |
|---|---|
| The session report is built with no second pass over the video | A live camera has no file to go back to |
| The threshold is frozen on Mac values and never retuned on the phone | Otherwise the demonstration could be made to pass |
| Tests that use real Vision run on macOS | Feature prints fail in the iOS Simulator |
| The pipeline writes the session log, not the harness | Every host then produces the same record |
