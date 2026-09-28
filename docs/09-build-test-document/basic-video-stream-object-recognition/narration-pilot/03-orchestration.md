This is the candidate analysis pipeline: the coordinator.

It connects the frame stream, target catalog, scorer, episode aggregator, and recorder.

The first Swift line starts a detached worker, keeping image analysis away from the user interface thread. The following lines connect cancellation to the stream and worker.

For each frame, the pipeline measures evidence, updates the episode, and records events. It keeps the previous frame available: the first sample in a new episode may be the best image to retain.

Tests check that results start before the video ends, replay rebuilds the live report, and stopping or cancelling produces exactly one summary.

These checks do not replace the final demonstration on a physical iPhone.
