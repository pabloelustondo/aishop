# Architecture and Sequence

HumanReviewerInitials: PME

## Components

```mermaid
sequenceDiagram
    actor U as Customer
    participant I as iOS App
    participant F as Firebase Auth
    participant A as Inspection API
    participant S as Cloud Storage
    participant O as OpenAI Responses API
    participant D as Firestore
    U->>I: Register or sign in
    I->>F: Email/Password or Google
    F-->>I: Firebase user session
    U->>I: Capture shelf/product photo
    I->>F: Request current ID token
    F-->>I: Signed ID token
    I->>A: POST /inspections + Bearer token + Base64 JPEG
    A->>F: Admin SDK verifyIdToken
    F-->>A: Verified uid
    A->>S: Create immutable original.jpg
    A->>O: JPEG data URL + strict report schema
    O-->>A: Structured findings
    A->>D: Create inspection with ownerId and findings
    A-->>I: 201 scanId, mode, report
    I-->>U: Mode-specific report screen
```

## Trust boundaries

- The client never sends `ownerId`; the server derives it from the verified token `uid`.
- The client never holds the OpenAI API key or Firebase Admin credentials.
- The Cloud Function is publicly invokable at the network layer but every inspection submission requires a valid Firebase ID token.
- Original bytes are stored before analysis; model output is stored separately as immutable initial findings.
- Customer detail reads require matching `ownerId`; reviewer queue/evidence access requires `reviewer: true`.
