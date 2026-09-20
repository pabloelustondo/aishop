# Sprint 001 Component Anchor

This diagram anchors the components and evidence flow defined by the
[Sprint Plan Tasks](02-sprint-plan-tasks.md). Numbers identify task order.

```mermaid
%%{init: {"themeVariables": {"fontSize": "20px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 55}}}%%
flowchart TB
    F[Bundled video fixtures] --> S[3 VideoFixtureFrameStream]
    S --> P[7 CandidateAnalysisPipeline]

    C[2 LocalTargetCatalog] --> A[1 VisionFeatureAdapter]
    A --> R[Target feature print]
    R --> Q[4 CandidateScorer]
    P --> Q
    Q --> G[5 CandidateEpisodeAggregator]
    G --> B[6 SessionReportBuilder]

    N[Fixed annotations] --> E[8 FixtureEvaluator]
    B --> E
    E --> O[PASS or FAIL plus evaluation report]

    subgraph Simulator[Offline iOS Simulator]
        X[9 Application bootstrap] --> H[10 VisionDiagnosticHarness]
        H --> P
        B --> H
    end

    I[11 Xcode integration] -. assembles .-> Simulator
    T[12 e2e/ios/run.zsh] --> X
    O --> T
    T --> D[13 Sprint evidence]

    Q -- whole frame and centered crop --> G
    G -- possible match --> H
```

Solid arrows are runtime or evidence flow. The dotted arrow is build-time
assembly. Firebase, authentication, camera, and network are outside this
debug-only fixture path; normal application startup remains unchanged.
