export const slides = [
  {
    "slug": "01-title",
    "title": "Streaming video\ncandidate recognition",
    "subtitle": "AIShop Sprint 001\nCode and test walkthrough",
    "kind": "cover"
  },
  {
    "slug": "02-intent",
    "title": "Sprint intent",
    "subtitle": "A useful signal while video is still arriving",
    "kind": "statements",
    "rows": [
      [
        "User need",
        "A shopper wants to notice when one known product may be visible."
      ],
      [
        "Sprint behavior",
        "Analyze arriving frames and show “possible match” before playback ends."
      ],
      [
        "Session outcome",
        "Keep the strongest whole frame and report each candidate episode."
      ],
      [
        "Scope boundary",
        "One local target. Prerecorded input. No camera, server, or object boxes."
      ]
    ]
  },
  {
    "slug": "03-use-cases",
    "title": "Sprint use cases",
    "subtitle": "The offline diagnostic journey",
    "kind": "flow",
    "nodes": [
      [
        "1  Select a fixture",
        "Banana present or no banana"
      ],
      [
        "2  Run and observe",
        "Timestamp-paced playback with live scores"
      ],
      [
        "3  Stop or reach the end",
        "Close the episode and inspect the retained best frame"
      ],
      [
        "4  Export evidence",
        "Compare the phone log with the Mac run"
      ]
    ],
    "foot": "The harness uses the same production pipeline as the Mac tests."
  },
  {
    "slug": "04-how-to-test",
    "title": "How to test",
    "subtitle": "Each test host answers a different question",
    "kind": "testing",
    "rows": [
      [
        "Native Mac",
        "./e2e/ios/run.zsh",
        "29 required tests passed with real Apple Vision"
      ],
      [
        "Simulator app tests",
        "AIShop-VisionDiagnostics scheme",
        "25 app tests passed, including Firebase bypass"
      ],
      [
        "Physical iPhone",
        "Watch both fixtures, export both logs",
        "Pending demonstration and Mac/phone calibration"
      ]
    ],
    "foot": "Debug and Release builds pass. A Mac or Simulator result cannot accept the sprint."
  },
  {
    "slug": "05-architecture",
    "title": "High-level architecture",
    "subtitle": "One pipeline, two execution hosts",
    "kind": "flow",
    "nodes": [
      [
        "Mac package tests / iPhone Debug harness",
        "Both call CandidateAnalysisPipeline"
      ],
      [
        "Local inputs",
        "LocalTargetCatalog + VideoFixtureFrameStream"
      ],
      [
        "CandidateScorer",
        "VisionFeatureAdapter compares whole frame and central crop"
      ],
      [
        "CandidateEpisodeAggregator",
        "Groups supporting samples and chooses the best evidence"
      ],
      [
        "Report and evidence",
        "SessionReportBuilder + JSONL SessionLog + separate local images"
      ]
    ],
    "foot": "FixtureEvaluator is a separate test/development target. The app does not link annotations."
  },
  {
    "slug": "06-orchestration",
    "title": "Pipeline orchestration",
    "subtitle": "CandidateAnalysisPipeline",
    "kind": "technical",
    "steps": [
      "Start a worker away from the UI thread",
      "Compose stream, scorer, aggregator, and recorder",
      "Finalize once after stop, cancellation, error, or EOF"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift",
    "codeLines": [
      "let worker = Task.detached { try await self.execute(onUpdate: onUpdate) }",
      "return try await withTaskCancellationHandler { try await worker.value } onCancel: {",
      "    self.stream.cancel()",
      "    worker.cancel()",
      "}"
    ],
    "test": "CandidateAnalysisPipelineTests + PipelineIntegrationSuite",
    "proof": "Real frames arrive before EOF. Reports rebuild from logs. Cancellation finalizes once."
  },
  {
    "slug": "07-streaming",
    "title": "Incremental frame delivery",
    "subtitle": "VideoFixtureFrameStream",
    "kind": "technical",
    "steps": [
      "Decode one video sample and keep its presentation timestamp",
      "Select eligible slots at 2 frames per second",
      "Replay holds one active consumer and one replaceable pending frame"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVision/VideoFixtureFrameStream/VideoFixtureFrameStream.swift",
    "codeLines": [
      "let (frames, continuation) = AsyncThrowingStream<VideoFrame, Error>.makeStream(",
      "    bufferingPolicy: .bufferingNewest(1))",
      "if case .dropped(let old) = continuation.yield(frame) {",
      "    try self.drop(old, observer: observer)",
      "}"
    ],
    "test": "VideoFixtureFrameStreamTests",
    "proof": "Both videos repeat with stable frame IDs. Slow replay drops stale work and stops cleanly."
  },
  {
    "slug": "08-target-and-vision",
    "title": "Reference image and Vision",
    "subtitle": "LocalTargetCatalog and VisionFeatureAdapter",
    "kind": "technical",
    "steps": [
      "Load one banana reference and preserve its EXIF orientation",
      "Generate and cache the reference feature print once",
      "Use Vision revision 2 and the fixed scaleFill policy"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVision/VisionFeatureAdapter.swift",
    "codeLines": [
      "let request = VNGenerateImageFeaturePrintRequest()",
      "request.revision = revision",
      "request.imageCropAndScaleOption = .scaleFill",
      "let handler = VNImageRequestHandler(",
      "    cgImage: image.image, orientation: image.orientation, options: [:]",
      " )"
    ],
    "test": "LocalTargetCatalogTests + VisionFeatureAdapterTests",
    "proof": "Tests run real inference, verify EXIF behavior, reject bad images, and check lazy caching."
  },
  {
    "slug": "09-scoring",
    "title": "Candidate scoring",
    "subtitle": "CandidateScorer and the frozen ScoringProfile",
    "kind": "technical",
    "steps": [
      "Compare the whole frame and a centered 60% × 60% crop",
      "Use the smaller distance as the frame's evidence",
      "Support the target when distance ≤ 0.4293864220380783"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVision/CandidateScorer/CandidateScorer.swift",
    "codeLines": [
      "public var distance: Double { min(wholeDistance, cropDistance) }",
      "public var similarity: Double { 1 / (1 + distance) }",
      "public func supports(maximumDistance: Double) -> Bool {",
      "    distance <= maximumDistance",
      "}"
    ],
    "test": "CandidateScorerTests + fixed-profile integration tests",
    "proof": "82 sampled frames support the calibration. Tests and phone runs never choose a new threshold."
  },
  {
    "slug": "10-episodes",
    "title": "Candidate episodes",
    "subtitle": "CandidateEpisodeAggregator",
    "kind": "episode",
    "nodes": [
      [
        "Waiting",
        "One supporting eligible sample starts a streak"
      ],
      [
        "Open",
        "The second consecutive supporting sample opens an episode"
      ],
      [
        "Active",
        "Stronger evidence replaces the best frame; earliest wins ties"
      ],
      [
        "Closed",
        "1.5 seconds without support, stop, cancellation, or EOF"
      ]
    ],
    "codeLines": [
      "if let previous, score.sampleIndex != previous.sampleIndex + 1 {",
      "    pending = nil; supportingStreak = 0",
      "}"
    ],
    "test": "CandidateEpisodeAggregatorTests",
    "proof": "Boundary, interrupted-streak, tie, repeat-episode, gap, stop, and EOF checks"
  },
  {
    "slug": "11-session-evidence",
    "title": "Session evidence and report replay",
    "subtitle": "SessionLog, PipelineRecorder, and SessionReportBuilder",
    "kind": "technical",
    "steps": [
      "Serialize stream and score events into one ordered JSONL log",
      "Build the live report from the same ordered events",
      "Rebuild report data without rereading the video"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVision/SessionReportBuilder/SessionReportBuilder.swift",
    "codeLines": [
      "let events = try SessionLog.read(url: logURL)",
      "for event in events { try builder.consume(event) }",
      "let recorded = try summary.payload(as: SessionReport.self)"
    ],
    "test": "SessionLogTests + SessionReportBuilderTests",
    "proof": "Truncated records, missing scores, write failures, and inconsistent reports remain failures."
  },
  {
    "slug": "12-fixture-results",
    "title": "Measured fixture outcome",
    "subtitle": "The frozen profile passes the current Mac acceptance rules",
    "kind": "results",
    "rows": [
      [
        "Positive fixture",
        "56 analyzed frames",
        "One episode opens at 24.5 s"
      ],
      [
        "Negative fixture",
        "26 analyzed frames",
        "No candidate episode"
      ],
      [
        "Best evidence",
        "25.0 s, central-crop comparison",
        "The retained image is the whole 1080 × 1920 frame"
      ],
      [
        "Delay and closure",
        "6.2 s after the expected interval begins",
        "The episode closes at 27.5 s after a support gap"
      ]
    ],
    "foot": "No episode opens in either fixture's false-positive zones. General accuracy remains unmeasured."
  },
  {
    "slug": "13-calibration",
    "title": "Mac and iPhone calibration",
    "subtitle": "FixtureEvaluator and AIShopVisionEvaluate",
    "kind": "technical",
    "steps": [
      "Evaluate episode openings against the fixed annotation zones",
      "Match both hosts by fixture, profile, frame ID, and media timestamp",
      "Record raw-distance drift and every threshold-decision disagreement"
    ],
    "codeFile": "ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation/FixtureEvaluator.swift",
    "codeLines": [
      "guard a.frameID == b.frameID, a.timestamp == b.timestamp,",
      "      a.sampleIndex == b.sampleIndex else {",
      "    throw EvaluationError.incompatibleHeader",
      "}"
    ],
    "test": "FixtureEvaluatorTests + calibration integration checks",
    "proof": "The comparator rejects missing fixtures, incompatible hosts, and incomplete or corrupt evidence."
  },
  {
    "slug": "14-app-boundary",
    "title": "Debug harness and application startup",
    "subtitle": "ApplicationBootstrap and VisionHarnessModel",
    "kind": "technical",
    "steps": [
      "Select the diagnostic route before creating normal services",
      "Run the same package with local fixture playback and log export",
      "Exclude the route and fixture media from Release"
    ],
    "codeFile": "ios/AIShop/AIShop/App/ApplicationBootstrap.swift",
    "codeLines": [
      "guard !isVisionDiagnostic(arguments: arguments, environment: environment) else {",
      "    return nil",
      "}",
      "return initialize()"
    ],
    "test": "ApplicationBootstrapTests + VisionHarnessModelTests",
    "proof": "The Simulator test host has no Firebase instance. Bundle checks verify only approved Debug media."
  },
  {
    "slug": "15-review",
    "title": "What the implementation establishes",
    "subtitle": "Evidence for the design decisions, with acceptance still open",
    "kind": "review",
    "rows": [
      [
        "Incremental behavior",
        "Real video reaches the consumer before EOF"
      ],
      [
        "Controlled workload",
        "One active consumer and one pending eligible frame"
      ],
      [
        "Reproducible evidence",
        "Stable frame IDs, fixed thresholds, replayable reports"
      ],
      [
        "Explicit uncertainty",
        "Provisional signals and an independent annotation evaluator"
      ]
    ],
    "foot": "Still open: physical-iPhone demonstration, exported-log calibration, human review, and acceptance."
  }
];

// Repo-relative targets shared by SVG, PowerPoint, and the scrolling readers.
const source = "ios/AIShop/AIShopVision/Sources/";
const core = source + "AIShopVision/";
const tests = "ios/AIShop/AIShopVision/Tests/AIShopVisionTests/";
const app = "ios/AIShop/AIShop/";
const appTests = "ios/AIShop/AIShopTests/";
const codeLinks = {
  "03-use-cases": [["Diagnostic screen", app + "Diagnostics/VisionDiagnosticHarness.swift"], ["Harness model", app + "Diagnostics/VisionHarnessModel.swift"]],
  "04-how-to-test": [["Gate script", "e2e/ios/run.zsh"], ["Package tests", tests], ["App tests", appTests]],
  "05-architecture": [["Pipeline components", core], ["Debug harness", app + "Diagnostics/"], ["Evaluator", source + "AIShopVisionEvaluation/"]],
  "06-orchestration": [["Pipeline source", core + "CandidateAnalysisPipeline/CandidateAnalysisPipeline.swift"], ["Pipeline tests", tests + "CandidateAnalysisPipelineTests.swift"], ["Integration suite", tests + "PipelineIntegrationSuite.swift"]],
  "07-streaming": [["Frame stream", core + "VideoFixtureFrameStream/VideoFixtureFrameStream.swift"], ["Stream contract", core + "VideoFixtureFrameStream/FrameStream.swift"], ["Streaming tests", tests + "VideoFixtureFrameStreamTests.swift"]],
  "08-target-and-vision": [["Target catalog", core + "LocalTargetCatalog/LocalTargetCatalog.swift"], ["Vision adapter", core + "VisionFeatureAdapter.swift"], ["Package tests", tests]],
  "09-scoring": [["Candidate scorer", core + "CandidateScorer/CandidateScorer.swift"], ["Scoring profile", core + "CandidateScorer/ScoringProfile.swift"], ["Scorer tests", tests + "CandidateScorerTests.swift"]],
  "10-episodes": [["Episode aggregator", core + "CandidateEpisodeAggregator/CandidateEpisodeAggregator.swift"], ["Episode tests", tests + "CandidateEpisodeAggregatorTests.swift"]],
  "11-session-evidence": [["Session log", core + "SessionLog/SessionLog.swift"], ["Pipeline recorder", core + "CandidateAnalysisPipeline/PipelineRecorder.swift"], ["Report builder", core + "SessionReportBuilder/SessionReportBuilder.swift"]],
  "12-fixture-results": [["Integration suite", tests + "PipelineIntegrationSuite.swift"], ["Fixture evaluator", source + "AIShopVisionEvaluation/FixtureEvaluator.swift"]],
  "13-calibration": [["Fixture evaluator", source + "AIShopVisionEvaluation/FixtureEvaluator.swift"], ["Evaluation CLI", source + "AIShopVisionEvaluate/main.swift"], ["Evaluator tests", tests + "FixtureEvaluatorTests.swift"]],
  "14-app-boundary": [["Application bootstrap", app + "App/ApplicationBootstrap.swift"], ["Harness model", app + "Diagnostics/VisionHarnessModel.swift"], ["App tests", appTests]],
  "15-review": [["Pipeline components", core], ["Integration suite", tests + "PipelineIntegrationSuite.swift"]]
};
for (const slide of slides) slide.codeLinks = codeLinks[slide.slug] ?? [];
