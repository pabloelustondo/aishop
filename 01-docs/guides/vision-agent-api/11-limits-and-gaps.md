# Limits, known gaps and review checklist

This is a source snapshot at a7f9d3c, not a statement of live acceptance.

| Constraint | Current value |
|---|---|
| JPEG | One valid JPEG, at most 5 MiB, 4096 px per axis |
| Video reservation | MP4 or QuickTime, at most 250 MiB |
| Video worker | At most 120 seconds, 4096 px per axis; H.264 validation |
| Sample budget | At most 12 representative JPEG frames |
| Context | At most 500 characters |
| Runs per record | 25 |
| API function | 120-second timeout, maxInstances 1, concurrency 1 |
| Video worker | 540 seconds, 2 GiB, one concurrent task dispatch |
| Collector | 60 seconds; provider control calls have 15-second deadlines |

The provider uses background:true and store:true without a supplied
max_output_tokens. Provider/service ceilings still apply.
A 15-second control-call deadline limits start/retrieve/delete transport,
not the duration of the provider's background analysis.
Hosting may have a shorter request boundary; use direct API during isolation.

## Findings Claude should review

- Public /run calls the runner without video attemptId. Modern video records
  require it: video retry/refinement may fail at the fence. Test this explicitly.
- Reservation returns created.version before recordVideoUploadSession increments
  it. Fetch latest detail before versioned cancellation.
- Public summary omits expectedByteLength and sourceComplete; clients must not
  assume these fields exist on every detail response.
- Restart currently always re-enters processing and re-extracts video frames.
  It is not a generic image restart or reuse-of-previous-frames implementation.
- The reconciler handles analysis collection, not all stalled processing/upload states.
- Task dispatch success plus recordVideoTask races need integration coverage.
- An uncertain provider start can leave analyzing without a recoverable response ID.
- Admin bulk cleanup is planned, not implemented.
- Cancellation is best effort for running external work; charges can still occur.
- Existing emulator video queue doubles/payloads appear older than the new task
  identity/attempt contracts. Re-run/fix the gate before claiming acceptance.

Enabling Compute Engine API did not remove the recorded Firebase CLI invoker
error. The worker nonetheless had a ready revision and existing invoker grant.
See [the operational record](../../11-operational-reality/operational-10-task-function-invoker-deployment.md).
Do not state that worker absence caused every stalled upload.

Source anchors: [media validation](../../../server/src/agent-video-media.js),
[API](../../../server/src/agent-api-handler.js), [E2E](../../../e2e/server/step-09-agent-video.mjs).
