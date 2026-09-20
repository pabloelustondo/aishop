# Sprint 001 Component Anchor

Proposed revision of the [Sprint Plan Tasks](02-sprint-plan-tasks.md) anchor.
Numbers identify task ownership; diagrams flow downward for vertical reading.

```mermaid
%%{init: {"themeVariables": {"fontSize": "20px"}, "flowchart": {"nodeSpacing": 35, "rankSpacing": 55}}}%%
flowchart TB
    F[2 Fixture resources] --> S[6 Video frame stream]
    F --> C[5 Target catalog]
    S --> P[10 Analysis pipeline]
    C -- target descriptor --> Q[7 Candidate scorer]
    P -- sampled frames --> Q
    Q -. frame and crop feature requests .-> A[1 Vision feature adapter]
    C -. reference feature request .-> A
    Q -- scores --> G[8 Episode aggregator]
    G -- episodes and best frames --> B[9 Session report builder]
    P -. records events through .-> L[4 Session log]
    B --> R[Session report and local images]
```

The pipeline uses the same components on both hosts. Solid arrows carry data;
dotted arrows identify service dependencies. Images stay separate.

```mermaid
%%{init: {"themeVariables": {"fontSize": "20px"}, "flowchart": {"rankSpacing": 55}}}%%
flowchart TB
    M[3 macOS integration command] --> T[12 Real-pipeline integration suite]
    T --> E[11 Fixture evaluator]
    E --> PASS{Pipeline gate passes?}
    PASS -- yes --> X[15 Xcode integration]
    X --> BOOT[13 Debug app bootstrap]
    BOOT --> UI[14 iPhone diagnostic harness]
    UI --> PHONE[16 Pablo sees both fixtures on iPhone]
    PHONE --> LOG[Export phone logs for evaluator 11]
    LOG --> CHECK{Phone outcomes pass?}
    CHECK -- yes --> D[17 Evidence and Pablo acceptance]
    CHECK -- no --> FIX
    PASS -- no --> FIX[Correct failing component and rerun]
```

The macOS command does not launch the app. Automated app-shell E2E coverage
remains a recorded gap. Physical iPhone verification is required for acceptance.
