export const chapters = [
  {
    "id": "01",
    "title": "Foundations",
    "start": 0,
    "end": 7
  },
  {
    "id": "02",
    "title": "Frame analysis",
    "start": 7,
    "end": 14
  },
  {
    "id": "03",
    "title": "Episodes and evidence",
    "start": 14,
    "end": 22
  },
  {
    "id": "04",
    "title": "Verification and iPhone",
    "start": 22,
    "end": 30
  }
];

export const slides = [
  {
    "slug": "01-title",
    "kind": "cover",
    "title": "Finding a known product",
    "subtitle": "AIShop Sprint 001\nApple Vision watches prerecorded video and signals a possible match before it ends",
    "narration": "Welcome. This walkthrough explains AIShopVision's first foundation: using Apple Vision to raise a provisional signal while a prerecorded video is still playing.\n\nWe begin with the intent, then show the two real fixture videos and the HITL journey. The positive fixture contains a banana. The control fixture does not. The system must raise a provisional signal only when its evidence supports it.\n\nOnly after that context do the four chapters move into architecture, frame analysis, episodes and evidence, and verification. The HITL, Human in the Loop, reviews the evidence and observes the final physical-iPhone run. Live camera capture and general object detection remain outside this sprint.",
    "codeLinks": [],
    "extraLinks": [
      [
        "Approved sprint plan",
        "ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md"
      ]
    ]
  },
  {
    "slug": "02-intent",
    "kind": "statements",
    "title": "Sprint intent",
    "subtitle": "A provisional signal while frames are still arriving",
    "rows": [
      [
        "User need",
        "Notice when a known product may be visible."
      ],
      [
        "Increment",
        "Analyze frames before the video finishes."
      ],
      [
        "Result",
        "Show possible match and retain the strongest evidence."
      ],
      [
        "Boundary",
        "One local target. Prerecorded video. Entirely local."
      ]
    ],
    "narration": "This sprint gives a user an early, provisional signal that one known product may be visible while a prerecorded video is still playing. The goal is timely evidence, not general object recognition.\n\nThe next slide introduces the concrete experiment: two recorded fixture videos with different expected outcomes. That visual example makes the words target, possible match, and control precise before we discuss the user journey.\n\nThe pipeline keeps the strongest evidence and summarizes the session without reading the video again. A feature-print distance remains provisional. This sprint provides neither object boxes nor a live camera.",
    "codeLinks": [
      [
        "Pipeline",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ]
    ],
    "extraLinks": [
      [
        "Scope",
        "ios/AIShop/01-docs/07-planning/sprints/sprint-001-candidate-target-signal/01-sprint-plan.md"
      ]
    ]
  },
  {
    "slug": "03-use-cases",
    "kind": "fixtures",
    "title": "The diagnostic use case",
    "subtitle": "Two fixture videos make the target and control cases concrete",
    "narration": "The last slide stated the intent. This slide makes the experiment concrete before the walkthrough uses the word banana again. The system receives one prerecorded video at a time.\n\nThe positive fixture is a kitchen video. In its annotated expected interval, the banana appears in frame. That is the target case. The negative fixture is a different kitchen video with no banana. It is the control case.\n\nThe HITL selects either fixture, watches the signal while video arrives, then reviews the saved evidence. Both fixtures enter the same local production pipeline. A possible-match episode belongs only to the positive video. The control video must finish with no false candidate. The next slide explains the evidence required for each host.",
    "codeLinks": [
      [
        "Fixture annotations",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json"
      ],
      [
        "Fixture resources",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources"
      ],
      [
        "Harness screen",
        "ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift"
      ]
    ]
  },
  {
    "slug": "04-how-to-test",
    "kind": "testing",
    "title": "How to test",
    "subtitle": "Three layers of evidence with different boundaries",
    "rows": [
      [
        "Mac pipeline gate",
        "./e2e/ios/run.zsh",
        "Real video, real Vision, production pipeline, both fixtures"
      ],
      [
        "Simulator app tests",
        "AIShop-VisionDiagnostics scheme",
        "Startup isolation and harness-model behavior"
      ],
      [
        "Physical iPhone",
        "Both fixtures and exported logs",
        "Required demonstration and host comparison remain pending"
      ]
    ],
    "foot": "Package integration is not full app-and-device end-to-end acceptance.",
    "narration": "Start with the Mac integration gate. It runs the package tests with real Vision and verifies that every required test actually executed. This covers the production analysis pipeline with recorded video as its input edge.\n\nThe Simulator tests answer a different question: whether diagnostic startup bypasses normal services and whether the harness model handles its states. The saved app-test snapshot has twenty-five passing tests. It does not establish working Vision inference on the Simulator.\n\nThe final layer is a physical iPhone run observed by the HITL, Human in the Loop, followed by comparison of exported logs. These layers complement each other. Neither a package pass nor an app build can stand in for device acceptance.",
    "codeLinks": [
      [
        "Mac gate",
        "e2e/ios/run.zsh"
      ],
      [
        "Integration tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ],
      [
        "App tests",
        "ios/AIShop/AIShopTests/"
      ]
    ]
  },
  {
    "slug": "05-architecture",
    "kind": "flow",
    "title": "High-level architecture",
    "subtitle": "Shared processing with separate hosts and evaluation",
    "nodes": [
      [
        "Mac tests or iPhone debug harness",
        "Select local inputs and call the same pipeline"
      ],
      [
        "Frame stream and target catalog",
        "Timestamped images and one cached reference feature"
      ],
      [
        "Scorer",
        "Whole-frame and central-crop Vision distances"
      ],
      [
        "Episode aggregator",
        "Require repeated support and retain the strongest frame"
      ],
      [
        "Recorder and report",
        "Ordered events, replayable report, separate JPEG evidence"
      ]
    ],
    "foot": "The annotation evaluator stays outside the production package.",
    "narration": "Read this architecture from top to bottom. Mac tests and the iPhone debug harness are hosts around the same production pipeline.\n\nThe frame stream supplies timestamped images. The local catalog supplies the reference feature. The scorer measures visual distance, and the aggregator decides when repeated support forms an episode.\n\nThe recorder feeds an ordered log and a report builder. Images live separately, so the log stays structured and can rebuild report data without carrying image bytes.\n\nThe evaluator belongs to a separate development target. It knows the annotation zones used to judge the fixtures. The production package never sees those answers. This separation helps us test behavior without teaching the application the expected result.",
    "codeLinks": [
      [
        "Core package",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/"
      ],
      [
        "Harness",
        "ios/AIShop/AIShop/Diagnostics/"
      ],
      [
        "Evaluator",
        "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/"
      ]
    ]
  },
  {
    "slug": "06-frame-flow",
    "kind": "flow",
    "title": "One frame through the pipeline",
    "subtitle": "The order of work is also the order of evidence",
    "nodes": [
      [
        "Receive and sample",
        "Record whether the decoded frame is eligible"
      ],
      [
        "Measure",
        "Produce whole-frame and crop distances"
      ],
      [
        "Aggregate",
        "Open, update, or close a candidate episode"
      ],
      [
        "Retain and record",
        "Save best-image evidence before logging its episode event"
      ],
      [
        "Publish",
        "Send the latest score, signal, and metrics to the host"
      ]
    ],
    "foot": "First update arrives before EOF. The pipeline never needs a second video pass.",
    "narration": "A sampled frame follows one path through the pipeline. The stream first records decoded frames and sampling decisions. For an eligible frame, the pipeline logs the sample and asks the scorer for measurements.\n\nIt logs the score before the aggregator consumes it. If an episode opens or its best frame changes, the pipeline saves the selected image and records the episode event. Only then does it publish an update to the host.\n\nThis order makes the live result explainable from the event log. A test checks that the first update occurs when only the first decoded frame has arrived. Another replays the saved log and compares it with the live report. These are direct checks of incremental behavior and evidence consistency.",
    "codeLinks": [
      [
        "Pipeline source",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Recorder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift"
      ],
      [
        "Pipeline tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift"
      ]
    ]
  },
  {
    "slug": "07-concurrency",
    "kind": "flow",
    "title": "Concurrency and ownership",
    "subtitle": "Analysis work stays outside the UI actor",
    "narration": "Concurrency matters because frame production and image analysis must not freeze the interface. The flow starts on the main actor, hands analysis to a detached pipeline worker, and returns updates to the main actor.\n\nDeterministic mode waits for each frame to finish. Paced mode adds a producer and a one-frame pending buffer. Stream callbacks can therefore overlap analysis. The recorder serializes logging and report updates so both see the same event order.\n\nThe harness uses a generation token to prevent an old run from replacing a newer run's state. Caller cancellation reaches both the stream and worker. The linked tests verify that pipeline updates originate outside the main thread, while the harness owns UI state.",
    "codeLinks": [
      [
        "Pipeline",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Recorder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift"
      ],
      [
        "Harness model",
        "ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift"
      ]
    ],
    "nodes": [
      [
        "UI on the main actor",
        "Start one run and display published updates"
      ],
      [
        "Detached pipeline worker",
        "Coordinate scoring, episodes, images, and reporting"
      ],
      [
        "Optional paced producer",
        "One consumer plus one replaceable pending frame"
      ],
      [
        "Serialized recorder",
        "Concurrent callbacks share one append-and-update lock"
      ],
      [
        "Main-actor update",
        "Generation token rejects results from an obsolete run"
      ]
    ],
    "foot": "Caller cancellation reaches both the stream and detached worker."
  },
  {
    "slug": "08-frame-contract",
    "kind": "statements",
    "title": "The frame-stream contract",
    "subtitle": "Chapter 2: from local video to visual evidence",
    "rows": [
      [
        "Identity",
        "Fixture ID plus the original media timestamp"
      ],
      [
        "Time",
        "Seconds within the video, not wall-clock time"
      ],
      [
        "Sample index",
        "Eligible sample slot; a gap means work was missed"
      ],
      [
        "Pixels",
        "One decoded image passed to one async consumer"
      ]
    ],
    "narration": "This chapter follows the input from recorded video to a candidate score. The frame-stream contract is the first boundary.\n\nEach frame has an identity derived from the fixture name and original presentation timestamp. That identity remains stable when the same media runs on another host. A separate timestamp in seconds drives episode timing.\n\nThe sample index identifies an eligible sampling slot, not a raw decoded-frame number. Missing slots must stay visible, because the aggregator must not treat separated observations as consecutive support.\n\nThe stream also reports received, skipped, and dropped frames. Its interface permits another source later, but replacing the fixture stream with a camera would still require camera-specific work and tests.",
    "codeLinks": [
      [
        "Frame contract",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/FrameStream.swift"
      ],
      [
        "Frame stream",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift"
      ],
      [
        "Stream tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift"
      ]
    ]
  },
  {
    "slug": "09-streaming",
    "kind": "flow",
    "title": "Incremental video decoding",
    "subtitle": "VideoFixtureFrameStream owns input delivery",
    "nodes": [
      [
        "Open the local video track",
        "AVAssetReader decodes incrementally"
      ],
      [
        "Read its presentation timestamp",
        "Keep media identity and received-frame accounting"
      ],
      [
        "Select an eligible sample slot",
        "Default cadence: 2 frames per second"
      ],
      [
        "Create an image and deliver it",
        "Continue without loading the complete video"
      ]
    ],
    "foot": "Invalid rate, unreadable video, or decode failure is an error.",
    "narration": "The frame stream owns decoding and sampling. It opens a local video track with Apple's asset reader and advances one decoded sample at a time.\n\nEvery sample contributes to the received count. Samples before the next eligible slot become skipped frames. Eligible samples become images with their original media timestamps and stable identities.\n\nThe default cadence is two samples per second. The implementation applies the track transform before creating the image. The current tests cover the upright fixtures; rotated-video behavior needs a dedicated regression case.\n\nInvalid rates and unreadable input fail explicitly. The stream is single-use. It must not score targets, inspect annotations, or wait for the whole file before delivering the first frame.",
    "codeLinks": [
      [
        "Stream implementation",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift"
      ],
      [
        "Stream tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VideoFixtureFrameStreamTests.swift"
      ]
    ]
  },
  {
    "slug": "10-replay-pressure",
    "kind": "technical",
    "title": "Replay under load",
    "subtitle": "A bounded queue favors current evidence",
    "steps": [
      "Deterministic mode waits for the consumer",
      "Paced mode keeps one pending eligible frame",
      "A newer pending frame replaces stale work"
    ],
    "codeLines": [
      "let (frames, continuation) = AsyncThrowingStream<VideoFrame, Error>.makeStream(",
      "    bufferingPolicy: .bufferingNewest(1))",
      "if case .dropped(let old) = continuation.yield(frame) {",
      "    try self.drop(old, observer: observer)",
      "}"
    ],
    "test": "Slow-consumer tests force drops and then stop",
    "proof": "Received = skipped + dropped + analyzed in a successful session.",
    "narration": "Two delivery modes serve two different purposes. Deterministic mode waits for analysis and preserves every eligible sample. This supports repeatable scoring and calibration.\n\nTimestamp-paced mode advances according to media time. If analysis is slower than playback, it keeps one pending eligible frame and replaces stale pending work. Dropped frames become explicit events rather than an invisible backlog.\n\nThe selected Swift lines show the newest-frame buffer. A slow-consumer integration test forces drops and verifies clean stopping and report replay.\n\nThis bounds the frame queue, not every form of session memory. The report builder retains latency samples, and saved evidence can grow with the session. Those limits matter before applying this design to long-running camera input.",
    "codeLinks": [
      [
        "Stream implementation",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift"
      ],
      [
        "Integration suite",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ],
      [
        "Report builder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift"
      ]
    ]
  },
  {
    "slug": "11-target",
    "kind": "statements",
    "title": "The local target catalog",
    "subtitle": "One reference descriptor, computed once",
    "rows": [
      [
        "Input",
        "A caller-supplied local reference-image URL"
      ],
      [
        "Output",
        "Product identity, reference hash, cached feature print"
      ],
      [
        "Responsibility",
        "Load the banana reference and reuse its descriptor"
      ],
      [
        "Boundary",
        "No app bundle lookup, network request, or annotation access"
      ]
    ],
    "narration": "The local catalog has one responsibility: produce the reference descriptor used by scoring. Its caller supplies a local image URL, so the catalog does not depend on the app bundle or a server.\n\nThe descriptor includes a stable product identity, display name, reference-image identity, and a hash of the source bytes. The catalog computes the reference feature print once and caches the result behind a lock.\n\nThat avoids repeating inference on an unchanged reference for every video frame. The hash later helps the evaluator reject evidence made from a different image.\n\nThis is one hard-coded banana probe, not a general product database. Missing or invalid reference data is an error. The cache test checks that repeated loads do not repeat feature extraction.",
    "codeLinks": [
      [
        "Local catalog",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/LocalTargetCatalog/LocalTargetCatalog.swift"
      ],
      [
        "Catalog tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/LocalTargetCatalogTests.swift"
      ],
      [
        "Diagnostic inputs",
        "ios/AIShop/AIShop/Diagnostics/DiagnosticFixture.swift"
      ]
    ]
  },
  {
    "slug": "12-vision",
    "kind": "technical",
    "title": "The Vision adapter",
    "subtitle": "A small boundary around Apple's feature-print request",
    "steps": [
      "Preserve encoded reference-image orientation",
      "Use revision 2 with scaleFill preprocessing",
      "Reject incompatible revisions or invalid distances"
    ],
    "codeLines": [
      "let request = VNGenerateImageFeaturePrintRequest()",
      "request.revision = revision",
      "request.imageCropAndScaleOption = .scaleFill",
      "let handler = VNImageRequestHandler(",
      "    cgImage: image.image, orientation: image.orientation, options: [:]",
      ")"
    ],
    "test": "Vision tests exercise real inference and orientation",
    "proof": "Underlying inference errors remain visible. There is no mock fallback.",
    "narration": "The Vision adapter translates an oriented image into Apple's feature print. The reference loader preserves its encoded orientation, and the request fixes revision two and the scale-fill policy.\n\nA feature print is a visual representation used for distance comparison. It does not return a product label or an object box. The wrapper rejects incompatible revisions and distances that are negative or non-finite.\n\nThe selected request lines show the framework boundary. Tests exercise real inference, bad input, and orientation. The adapter preserves Apple's underlying errors, which made the Simulator failure visible.\n\nReal development validation therefore runs on the Mac. The phone must still establish that the same inputs and profile behave acceptably on device.",
    "codeLinks": [
      [
        "Vision adapter",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/VisionFeatureAdapter.swift"
      ],
      [
        "Vision tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/VisionFeatureAdapterTests.swift"
      ]
    ]
  },
  {
    "slug": "13-scorer",
    "kind": "technical",
    "title": "Per-frame scoring",
    "subtitle": "Two distances describe one sampled frame",
    "steps": [
      "Measure the whole image and a central 60% crop",
      "Keep both distances and select the smaller one",
      "Carry frame identity, sample slot, media time, and latency"
    ],
    "codeLines": [
      "public var distance: Double { min(wholeDistance, cropDistance) }",
      "public var similarity: Double { 1 / (1 + distance) }",
      "public func supports(maximumDistance: Double) -> Bool {",
      "    distance <= maximumDistance",
      "}"
    ],
    "test": "Scorer tests verify variant choice and fixed behavior",
    "proof": "Lower distance is closer. Similarity is not a probability.",
    "narration": "The scorer compares two views of each sampled frame with the same target feature: the complete image and a centered crop covering sixty percent of each dimension.\n\nIt keeps both raw distances. The smaller distance determines the selected variant and support decision. A displayed similarity is one divided by one plus distance. That conversion is a convenience score, not a calibrated probability.\n\nThe score record carries frame identity, media time, sample slot, and measurement latency. The aggregator consumes its support decision, while reports and calibration retain the raw measurements.\n\nThe scorer does not choose thresholds or read annotations. A central crop is a fixed view of the image, not a detected object region.",
    "codeLinks": [
      [
        "Scorer and score type",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift"
      ],
      [
        "Scorer tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateScorerTests.swift"
      ],
      [
        "Frozen profile",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift"
      ]
    ]
  },
  {
    "slug": "14-rules",
    "kind": "statements",
    "title": "Frozen rules and their reasons",
    "subtitle": "A repeatable experiment needs stable decisions",
    "rows": [
      [
        "Sampling and preprocessing",
        "2 samples/s, Vision revision 2, scaleFill, central crop 0.6"
      ],
      [
        "Support threshold",
        "Distance ≤ 0.4293864220380783"
      ],
      [
        "Episode rules",
        "2 consecutive supporting slots; close after a 1.5 s gap"
      ],
      [
        "Reason and limitation",
        "Fixed Mac-fixture experiment, not a universal product model"
      ]
    ],
    "foot": "Neither tests nor phone runs retune the threshold.",
    "narration": "The profile records the experiment's fixed settings. Two samples per second limit work. Two consecutive supporting slots avoid opening an episode on one isolated hit. A one-point-five-second gap closes an active episode.\n\nThe threshold is approximately zero point four two nine four. The exact value stays in the profile and every session header. The calibration script selected a wide decision-margin interval that passed the approved fixture rules.\n\nThese values come from a small Mac fixture set. Broader reliability is unmeasured. Tests and phone verification must use the frozen values, not select new ones to pass.\n\nSome settings are implemented directly in the scorer or aggregator as well as recorded in the profile. Changing the profile alone is not a general configuration mechanism.",
    "codeLinks": [
      [
        "Profile",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/ScoringProfile.swift"
      ],
      [
        "Calibration script",
        "e2e/ios/calibrate-scorer.rb"
      ],
      [
        "Aggregator",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift"
      ]
    ]
  },
  {
    "slug": "15-episode-state",
    "kind": "flow",
    "title": "The candidate episode lifecycle",
    "subtitle": "Chapter 3: turn frame scores into retained evidence",
    "nodes": [
      [
        "No active episode",
        "The first supporting sample becomes pending"
      ],
      [
        "Pending support",
        "Next consecutive supporting slot opens an episode"
      ],
      [
        "Open episode",
        "Further support refreshes time and may improve the best frame"
      ],
      [
        "Closed episode",
        "Gap, stop, cancellation, error, or end closes the episode"
      ]
    ],
    "foot": "A missed slot or unsupported sample resets pending support.",
    "narration": "This chapter explains how frame measurements become episodes and durable evidence. An episode groups repeated support for the same target.\n\nThe aggregator starts with no active episode. One supporting sample becomes pending. A second supporting sample in the next eligible slot opens the episode. An unsupported sample or missed slot resets the opening streak.\n\nWhile open, more support refreshes the last-supported time. A lower distance replaces the best frame; equal distances keep the earlier one. A support gap of at least one-point-five seconds closes the episode. Stop, cancellation, error, and end of stream also close it.\n\nAfter closure, later support can open a new episode. Episodes are sightings, not deduplicated physical items.",
    "codeLinks": [
      [
        "Episode aggregator",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift"
      ],
      [
        "Episode tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift"
      ],
      [
        "Lifecycle integration",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ]
    ]
  },
  {
    "slug": "16-episode-data",
    "kind": "statements",
    "title": "Episode and signal contracts",
    "subtitle": "Recorded history and live feedback have different jobs",
    "rows": [
      [
        "Episode timing",
        "startedAt = first support; openedAt = confirmation sample"
      ],
      [
        "Evidence",
        "Best frame ID, timestamp, distance, variant, and image ID"
      ],
      [
        "Closure",
        "Last support, close time, and explicit close reason"
      ],
      [
        "Live signal",
        "Current media time, streak, latency, and possible match"
      ]
    ],
    "narration": "An episode is the retained history of a possible sighting. Its start time is the first supporting sample, while its opening time is the second sample that confirms the streak. Keeping both avoids hiding the confirmation delay.\n\nThe episode stores the strongest frame's identity, time, distance, and comparison variant. It also keeps support count and closure information. The best-image identifier points to a separate JPEG file.\n\nA live signal serves the interface. It reports current media time, consecutive support, and latency while an episode is active. The signal can remain visible during the tolerated gap even when the latest frame does not support the target.\n\nBoth records use possible match. Neither claims an exact product identity.",
    "codeLinks": [
      [
        "Episode and signal types",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift"
      ],
      [
        "Episode tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateEpisodeAggregatorTests.swift"
      ],
      [
        "Harness display",
        "ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift"
      ]
    ]
  },
  {
    "slug": "17-recorder",
    "kind": "flow",
    "title": "One ordered evidence path",
    "subtitle": "PipelineRecorder connects the log and the live report",
    "nodes": [
      [
        "Concurrent callbacks",
        "Stream events and analysis results may arrive from different tasks"
      ],
      [
        "Recorder lock",
        "Serialize each complete append-and-consume operation"
      ],
      [
        "Session log",
        "Assign sequence and write the JSONL event"
      ],
      [
        "Report builder",
        "Consume that same event before releasing the lock"
      ]
    ],
    "foot": "One ordering rule prevents the live report from drifting from the log.",
    "narration": "The recorder is the ordering boundary between concurrent activity and session evidence. Stream callbacks and analysis may arrive from different tasks, but each recorder operation holds one lock.\n\nInside that operation, the session log assigns the sequence number and writes the event. The report builder then consumes that exact event before the lock is released.\n\nThis is stronger than keeping separate counters in the harness. Every host gets the same event vocabulary and report logic. Episode changes also pass through this path, so opened, best-frame-replaced, and closed events share the session order.\n\nThe recorder owns coordination, while the log owns encoding and the builder owns report meaning. Write or decoding failures propagate instead of manufacturing a successful result.",
    "codeLinks": [
      [
        "Recorder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/PipelineRecorder.swift"
      ],
      [
        "Log writer",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/SessionLog.swift"
      ],
      [
        "Report builder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift"
      ]
    ]
  },
  {
    "slug": "18-images",
    "kind": "statements",
    "title": "Retained image evidence",
    "subtitle": "The report references pixels saved during analysis",
    "rows": [
      [
        "Selection",
        "Lowest distance wins; earliest frame wins a tie"
      ],
      [
        "Opening detail",
        "Keep the previous frame because it may be the best first hit"
      ],
      [
        "Storage",
        "Write a whole-frame JPEG separately from JSONL"
      ],
      [
        "Limit",
        "A replayed log reconstructs image IDs, never missing pixels"
      ]
    ],
    "narration": "The strongest evidence is saved while the pipeline still has the image. At episode opening, the best sample can be the first hit rather than the current frame. That is why the pipeline keeps the previous frame available.\n\nWhen evidence improves, it writes the selected whole frame to the retained-image store and records its identifier. Even when a central crop produced the winning distance, the saved evidence is the whole frame, not an object crop.\n\nThe image store rejects unsafe identifiers and reports write failures. Missing files stay missing; the interface does not substitute another image.\n\nReplaying the log can recover report data and image identifiers, but not image pixels. A complete evidence handoff therefore needs the log and retained image files.",
    "codeLinks": [
      [
        "Image store",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/RetainedImageStore.swift"
      ],
      [
        "Pipeline selection",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Report tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionReportBuilderTests.swift"
      ]
    ]
  },
  {
    "slug": "19-log-contract",
    "kind": "statements",
    "title": "The session-log contract",
    "subtitle": "One JSON object per line, one ordered session",
    "rows": [
      [
        "Envelope",
        "Sequence, session ID, event kind, frame ID, media timestamp"
      ],
      [
        "Header",
        "Schema version, host, build, fixture/reference hashes, profile"
      ],
      [
        "Body",
        "Sampling, scores, episode changes, termination, and errors"
      ],
      [
        "End",
        "Exactly one summary and one stream-end event"
      ]
    ],
    "narration": "The session log is newline-delimited JSON. Each event has a sequence number, session identity, kind, optional frame identity and media time, plus typed fields.\n\nThe header identifies the schema, host, build, input hashes, and scoring profile. This context matters when two runs appear to disagree. The body records the decisions that led to the result.\n\nThe reader requires consecutive sequence numbers, one session, one header, one stream-end event, and one final summary. Every sampled frame must have exactly one score. Truncated lines, missing scores, or error events reject a session as successful evidence.\n\nThese checks detect inconsistency. They are not a cryptographic signature proving who produced a log. Keep that trust boundary explicit.",
    "codeLinks": [
      [
        "Log schema",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/LogValue.swift"
      ],
      [
        "Log validation",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionLog/SessionLog.swift"
      ],
      [
        "Log tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionLogTests.swift"
      ]
    ]
  },
  {
    "slug": "20-report-replay",
    "kind": "technical",
    "title": "Report construction and replay",
    "subtitle": "The same event reducer serves live and offline views",
    "steps": [
      "Count frames and accumulate latency from events",
      "Update episodes by stable episode ID",
      "Rebuild and compare with the recorded final summary"
    ],
    "codeLines": [
      "let events = try SessionLog.read(url: logURL)",
      "for event in events { try builder.consume(event) }",
      "let recorded = try summary.payload(as: SessionReport.self)"
    ],
    "test": "Report tests reject inconsistent summaries",
    "proof": "The report never decodes the source video again.",
    "narration": "The report builder reduces events into a session view. It counts received, skipped, and dropped frames, collects measurement latencies, and updates episodes by their stable identifiers.\n\nReplay uses the same reducer on the saved log. It checks that the reconstructed report equals the recorded summary, that frame accounting balances, and that every recorded episode is closed.\n\nThe report contains the mean and ninety-fifth-percentile inference latency. Those measurements describe scoring on the named host, not complete camera-to-screen delay.\n\nThe excerpt selects the replay operations. Complete validation guards are in the source. Latency values currently accumulate in memory and are sorted for reporting, so long-session behavior needs further profiling.",
    "codeLinks": [
      [
        "Report builder",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift"
      ],
      [
        "Report tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/SessionReportBuilderTests.swift"
      ],
      [
        "Integration replay",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ]
    ]
  },
  {
    "slug": "21-session-end",
    "kind": "flow",
    "title": "Session termination",
    "subtitle": "One run, one finalization path",
    "nodes": [
      [
        "Running session",
        "Frames update an optional active episode"
      ],
      [
        "End, user stop, or task cancellation",
        "Stop input and identify the stream-end reason"
      ],
      [
        "Close the active episode",
        "Retain its last evidence and explicit close reason"
      ],
      [
        "Finalize",
        "Write stream-end event, summary, and close the log"
      ]
    ],
    "foot": "One-shot execution and lifecycle tests guard against duplicate summaries.",
    "narration": "Normal exhaustion, user stop, and task cancellation are distinct outcomes. The stream returns its reason, and the pipeline closes any still-open episode with that reason before writing the final report.\n\nThe pipeline is single-use. Starting it again is an error. Tests cover stopping after the first sample, cancelling a running task, and closing an open episode at either a finite fixture prefix or user stop.\n\nThe cancellation test verifies exactly one session summary. The prefix test deliberately changes the input edge while keeping the production scorer and aggregator.\n\nThese are successful finalization paths, not a promise that every failure leaves a complete log. Setup and storage failures can prevent logging itself. The next slide makes that boundary explicit.",
    "codeLinks": [
      [
        "Pipeline lifecycle",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Lifecycle integration",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ],
      [
        "One-shot test",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift"
      ]
    ]
  },
  {
    "slug": "22-failures",
    "kind": "statements",
    "title": "Failure behavior",
    "subtitle": "Errors must remain distinguishable from negative results",
    "rows": [
      [
        "Invalid input or inference",
        "Throw the underlying error; no invented score"
      ],
      [
        "Failure after log creation",
        "Record error and close an open episode when writing is possible"
      ],
      [
        "Storage or early setup failure",
        "A complete summary may be impossible; surface the failure"
      ],
      [
        "Evidence reader",
        "Reject failed, truncated, or inconsistent sessions"
      ]
    ],
    "narration": "No match and failed analysis are different outcomes. A negative result needs a valid completed run. Invalid input or failed inference must not silently become a low score or an empty successful report.\n\nInside the recorded execution path, the pipeline attempts to log the error, close an open episode, and finish before rethrowing. The error marker keeps that log from being accepted as successful evidence, even though the stream-end field uses stopped.\n\nFailures creating the output directory, image store, or log happen earlier. A later write failure can also prevent cleanup. Those paths may have no complete summary.\n\nThe harness displays a failed state and message. Existing tests cover a missing reference; additional injected storage failures would strengthen lifecycle coverage.",
    "codeLinks": [
      [
        "Pipeline error path",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Failure tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/CandidateAnalysisPipelineTests.swift"
      ],
      [
        "Harness model",
        "ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift"
      ]
    ]
  },
  {
    "slug": "23-evaluation",
    "kind": "statements",
    "title": "Independent fixture evaluation",
    "subtitle": "Chapter 4: what the evidence proves, and what it does not",
    "rows": [
      [
        "Expected zone",
        "At least one candidate episode opens in the positive interval"
      ],
      [
        "False-positive zone",
        "No candidate episode may open there"
      ],
      [
        "Do-not-care or unannotated time",
        "Does not satisfy the expected-zone requirement"
      ],
      [
        "Evaluation boundary",
        "Check hashes, profile, scores, and rebuilt episodes first"
      ]
    ],
    "narration": "This chapter separates measured evidence from acceptance. The fixture evaluator is independent of the application and reads the annotation file plus a completed session log.\n\nBefore evaluating outcomes, it validates the input hashes and frozen profile, checks score consistency, and rebuilds the episodes. It then judges episode opening times against annotation zones.\n\nThe positive fixture must open an episode in its expected interval. Neither fixture may open an episode in a false-positive zone. Do-not-care and unannotated times do not count as the required positive detection.\n\nThese rules evaluate openings, not frame-by-frame object accuracy or every moment an episode remains visible. The two fixtures support this bounded experiment, not a claim of general precision or recall.",
    "codeLinks": [
      [
        "Fixture evaluator",
        "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift"
      ],
      [
        "Annotation data",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/Resources/annotations.json"
      ],
      [
        "Evaluator tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/FixtureEvaluatorTests.swift"
      ]
    ]
  },
  {
    "slug": "24-results",
    "kind": "results",
    "title": "Measured fixture results",
    "subtitle": "Saved macOS evidence from 20 September 2026",
    "rows": [
      [
        "Positive fixture",
        "56 analyzed frames; 1 episode",
        "Opened at 24.5 s; best frame at 25.0 s"
      ],
      [
        "Negative fixture",
        "26 analyzed frames; 0 episodes",
        "No openings in either fixture's false-positive zones"
      ],
      [
        "Detection delay",
        "6.2 s after the expected zone begins",
        "The expected interval begins at 18.3 s"
      ],
      [
        "Evidence strength",
        "Best distance 0.34894; threshold 0.42939",
        "Closest false-positive-zone distance across fixtures: 0.90553"
      ]
    ],
    "foot": "Zero dropped frames in these deterministic runs. Phone behavior is unmeasured.",
    "narration": "Saved Mac evidence shows one episode in the positive fixture and none in the negative fixture. The runs analyze fifty-six and twenty-six frames respectively, with no dropped frames in deterministic mode.\n\nThe positive episode opens at twenty-four point five seconds. The expected interval begins at eighteen point three, so the first signal delay is six point two seconds. That delay is a real finding, even though the acceptance rule passes.\n\nThe strongest evidence occurs at twenty-five seconds, with distance about zero point three four nine. The nearest frame in either false-positive zone is much farther away, about zero point nine zero six.\n\nThese are measurements of the named fixtures on this Mac. They say nothing yet about shelf clutter, device latency, or general recognition accuracy.",
    "codeLinks": [
      [
        "Positive evaluation",
        "docs/09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-positive/evaluation.json"
      ],
      [
        "Negative evaluation",
        "docs/09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-negative/evaluation.json"
      ],
      [
        "Positive report",
        "docs/09-build-test-document/basic-video-stream-object-recognition/artifacts/evidence/mac-positive/report.json"
      ]
    ]
  },
  {
    "slug": "25-calibration",
    "kind": "statements",
    "title": "Mac and iPhone comparison",
    "subtitle": "Match evidence first, then compare decisions",
    "rows": [
      [
        "Prerequisites",
        "Same inputs, reference, profile, frame IDs, and timestamps"
      ],
      [
        "Completeness",
        "Both fixtures, normal exhaustion, zero drops, contiguous slots"
      ],
      [
        "Agreement",
        "Every sampled frame is on the same side of the threshold"
      ],
      [
        "Outcomes",
        "0 = agreement; 2 = changed decisions; 1 = failed or invalid evidence"
      ]
    ],
    "narration": "Calibration compares complete Mac and phone runs of the same fixtures. It checks host identity, input hashes, profile, frame identities, timestamps, and sampling slots. Missing fixtures or dropped samples make evidence incomplete.\n\nFor corresponding frames, it records the largest raw-distance drift and every support-decision disagreement. The command returns zero for agreement. It returns two when decisions differ but the phone's fixture outcomes still pass. That is a major finding which blocks Sprint Two threshold work. One means an outcome failed or evidence was rejected.\n\nSynthetic phone labels in tests exercise this comparator only. They are not device evidence. The threshold must remain frozen during the real phone session.",
    "codeLinks": [
      [
        "Comparator",
        "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift"
      ],
      [
        "Evaluation CLI",
        "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluate/main.swift"
      ],
      [
        "Comparator tests",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ]
    ],
    "extraLinks": [
      [
        "Phone acceptance rules",
        "ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md"
      ]
    ]
  },
  {
    "slug": "26-app-boundary",
    "kind": "flow",
    "title": "Diagnostic app boundary",
    "subtitle": "Offline package behavior inside a debug-only host",
    "nodes": [
      [
        "Choose the diagnostic startup route",
        "Xcode arguments or environment select the harness"
      ],
      [
        "Bypass normal services",
        "Do not initialize Firebase or authentication"
      ],
      [
        "Run the shared pipeline",
        "Main-actor model manages playback, updates, and reports"
      ],
      [
        "Keep Release separate",
        "Exclude diagnostic code and fixture media"
      ]
    ],
    "foot": "The ordinary app launch follows the normal sign-in route.",
    "narration": "The app boundary makes the package demonstrable without turning a diagnostic experiment into the normal product experience. Bootstrap selects the diagnostic route before creating Firebase or the authentication session.\n\nThe harness model is on the main actor. It prevents overlapping starts, uses a generation token for updates, pauses playback on completion or failure, and writes a report beside the log. The screen exposes local log export.\n\nDebug builds copy only the approved reference and trimmed videos. Release excludes the diagnostic route and fixture assets. The evaluator and its annotation file stay outside the app.\n\nThe saved Simulator tests include a check that the diagnostic host has no Firebase instance. That test depends on running the diagnostic scheme.",
    "codeLinks": [
      [
        "Bootstrap",
        "ios/AIShop/AIShop/App/ApplicationBootstrap.swift"
      ],
      [
        "Harness model",
        "ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift"
      ],
      [
        "Bundle checks",
        "e2e/ios/verify-app-bundle.rb"
      ]
    ]
  },
  {
    "slug": "27-iphone-runbook",
    "kind": "statements",
    "title": "The physical-iPhone session",
    "subtitle": "Manual acceptance steps still to be performed",
    "rows": [
      [
        "1  Launch from Xcode",
        "Select AIShop-VisionDiagnostics and the connected phone"
      ],
      [
        "2  Observe both fixtures",
        "Run to the end; inspect possible match and the final report"
      ],
      [
        "3  Export complete evidence",
        "Save both session logs plus reports and retained images"
      ],
      [
        "4  Compare on the Mac",
        "Use AIShopVisionEvaluate --compare; record device and outcome"
      ]
    ],
    "foot": "Do not retune on phone values. HITL must observe the actual device run.",
    "narration": "The phone session remains manual and unperformed. Connect the iPhone, choose the diagnostic scheme in Xcode, and run on that device. The normal app icon does not provide these launch arguments.\n\nRun banana present to completion. The HITL, Human in the Loop, must see a possible match before playback ends and inspect the final report. Repeat with no banana. Export both logs. Preserve reports and retained images from the app container.\n\nRun the Mac gate for matching baseline evidence, then use the companion runbook comparison command. Check for zero dropped frames before comparison.\n\nRecord device model, operating system, build, date, and findings. The demonstration and the HITL's committed acceptance record complete a gate that Mac tests cannot replace.",
    "codeLinks": [
      [
        "Diagnostic scheme",
        "ios/AIShop/AIShop.xcodeproj/xcshareddata/xcschemes/AIShop-VisionDiagnostics.xcscheme"
      ],
      [
        "Harness export",
        "ios/AIShop/AIShop/Diagnostics/VisionDiagnosticHarness.swift"
      ],
      [
        "Phone verification",
        "ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md"
      ]
    ]
  },
  {
    "slug": "28-review-risks",
    "kind": "statements",
    "title": "Where to look hardest",
    "subtitle": "Review concerns visible in the current working tree",
    "rows": [
      [
        "Paced replay versus calibration",
        "The harness may drop frames; comparison requires zero drops"
      ],
      [
        "Diagnostic launch and tests",
        "Xcode scheme selects the route; ordinary launch does not"
      ],
      [
        "Orientation coverage",
        "Current fixtures are upright; rotated-track behavior needs a test"
      ],
      [
        "Long-session resources",
        "Bounded frame queue does not bound latency history or saved images"
      ]
    ],
    "foot": "These are review concerns, not fixes silently included in this walkthrough.",
    "narration": "Four areas deserve close review. First, the harness only offers paced replay, which can drop frames under load, while calibration rejects any dropped-frame evidence. The device run may therefore expose an evidence gap even when the interface appears useful.\n\nSecond, both the diagnostic startup path and one app test depend on the diagnostic Xcode scheme. Ordinary launch is intentionally different.\n\nThird, the stream applies a track transform, but current fixtures do not establish correct behavior for rotated video. A concern about rotation exists in the review material; this walkthrough does not claim to reproduce that defect.\n\nFinally, the bounded frame queue does not bound latency history or retained image files. Long-session resource behavior remains an engineering question.",
    "codeLinks": [
      [
        "Harness replay",
        "ios/AIShop/AIShop/Diagnostics/VisionHarnessModel.swift"
      ],
      [
        "Comparator preconditions",
        "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift"
      ],
      [
        "Report resources",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift"
      ]
    ]
  },
  {
    "slug": "29-foundation",
    "kind": "statements",
    "title": "What this foundation gives us",
    "subtitle": "Reusable mechanisms with explicit next-step boundaries",
    "rows": [
      [
        "A shared processing path",
        "Hosts change; core analysis and evidence stay together"
      ],
      [
        "Observable decisions",
        "Stable identities, frozen rules, ordered events, replayable reports"
      ],
      [
        "Testable separation",
        "Fixture input, production inference, independent evaluation"
      ],
      [
        "Still to establish",
        "Physical iPhone acceptance, live camera, regions, and broader accuracy"
      ]
    ],
    "narration": "The foundation is separation of responsibilities. Hosts provide input and display results, while one production pipeline owns analysis and evidence. Stable frame identities and frozen settings make runs comparable.\n\nThe event log explains how a report was produced, and replay checks that explanation against the live result. Independent annotation evaluation keeps the expected answers outside production inference. These mechanisms support later work.\n\nThe implementation still has a narrow scope. It compares one target against the whole image and a fixed central crop. Live camera capture, detected regions, multiple products, and general accuracy require new work and evidence.\n\nA passing fixture experiment is a base to build on. It is not completion of the application or acceptance on iPhone.",
    "codeLinks": [
      [
        "Production pipeline",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"
      ],
      [
        "Integration suite",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/PipelineIntegrationSuite.swift"
      ],
      [
        "Package boundaries",
        "ios/AIShop/AIShopVision/Package.swift"
      ]
    ]
  },
  {
    "slug": "30-fine-print",
    "kind": "statements",
    "title": "The fine-print map",
    "subtitle": "A route into the implementation whenever you need detail",
    "rows": [
      [
        "Foundations",
        "Intent, test hosts, architecture, frame flow, concurrency"
      ],
      [
        "Frame analysis",
        "Input contracts, decoding, load, reference, Vision, scoring"
      ],
      [
        "Episodes and evidence",
        "State, records, storage, replay, lifecycle, failures"
      ],
      [
        "Verification",
        "Annotations, measured outcomes, calibration, app and phone"
      ]
    ],
    "narration": "The companion walkthrough maps the implementation. Each technical slide has a small set of clickable source, test, or evidence links. The notes explain the meaning before you open those files.\n\nA separate file-coverage index maps changes since the sprint baseline to the relevant subjects. It records exceptions such as original media and unrelated documentation moves. That index is a completeness backstop, not the main explanation.\n\nThe maintained slide content also supplies the narration, so the video and written explanation can be revised together. Four subject-based videos keep each review session short. Return to any chapter independently, and pause to inspect the code.\n\nThe next human decision is about the review findings and the required iPhone demonstration.",
    "codeLinks": [
      [
        "Source package",
        "ios/AIShop/AIShopVision/Sources/AIShopVision/"
      ],
      [
        "Test package",
        "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/"
      ],
      [
        "Acceptance record",
        "ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md"
      ]
    ]
  }
];
