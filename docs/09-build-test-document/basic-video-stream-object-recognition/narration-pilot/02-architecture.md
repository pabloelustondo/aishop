Read this diagram from top to bottom.

Mac package tests and the iPhone debug harness call the same production pipeline. We test the processing logic on the Mac without creating a different implementation for the phone.

Local inputs supply a reference image and a stream of video frames. The scorer uses Apple Vision to compare each sampled frame with the reference, using the whole frame and a central crop.

The episode aggregator groups supporting samples into a possible-match episode and keeps the strongest evidence. The recorder writes an event log and a session report. Retained images stay in separate files.

The fixture evaluator checks results against test annotations. The production package has no network, Firebase, or sign-in dependency.
