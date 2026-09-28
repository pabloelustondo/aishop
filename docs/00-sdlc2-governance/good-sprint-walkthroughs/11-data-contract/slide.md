# Pattern: a data contract

## Example: the score record, one per analysed frame

| Field | Meaning | Who reads it |
|---|---|---|
| `frameID` | Fixture name plus the frame's original timestamp; identical on every host | Evaluator, calibration |
| `timestamp` | Media time in seconds | Aggregator, evaluator |
| `sampleIndex` | Which two-per-second slot this is; a gap means a missed slot | Aggregator, calibration |
| `wholeDistance` | Vision distance from the whole frame to the reference; lower is closer | Report, calibration |
| `cropDistance` | The same for the central crop | Report, calibration |
| `processingLatency` | Seconds spent measuring this frame | Report |

Derived when logged: `distance` is the smaller of the two; `supporting` is
`distance` at or below the frozen threshold.
