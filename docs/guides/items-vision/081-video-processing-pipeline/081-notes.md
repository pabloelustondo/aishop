# 081 - Vision Agent Video Processing Pipeline

This slide follows the public route map into the server's asynchronous implementation.
The focus is the newer Vision Agent video path, not the older iPhone request path.

## Upload and handoff
The client reserves a new analysis ID through `POST /v1/agent/video-uploads`.
The server creates an uploading Firestore record and a resumable Storage session.
The video bytes travel directly to private Cloud Storage via the session URI.
Storage may answer 308 with the acknowledged byte range during an incomplete transfer.
The client must not call complete until Storage has accepted the final bytes.
`POST /v1/agent/video-uploads/{id}/complete` checks object media type and size,
transitions the record to processing, and queues background work.
A 200 processing response confirms neither worker delivery nor model quality.

## Video worker
Cloud Tasks dispatches `processAgentVideo` with ownerKey, analysisId and attemptId.
The worker reads the original video from Storage and validates its content.
FFmpeg selects representative JPEG frames; frame paths include the attempt ID.
The current source snapshot sets a budget of at most 12 representative frames.
The server retains frame provenance including timestamps for later inspection.
It sends a single multi-image request rather than independent per-frame counts.
The prompt asks for one shelf inventory across the clip and cross-frame deduplication.
That is an intended counting rule; its accuracy still needs human validation.

## Model response and settlement
The server starts an OpenAI background response and saves its response identifier.
`collectAgentAnalysis` retrieves provider status through a private task.
The collector writes the finished report or failure to Firestore.
`reconcileAgentAnalyses` schedules overdue collection attempts.
It does not sweep every stalled upload or video-processing state.
Only server components write Firestore; OpenAI never connects to it.
The client polls GET detail to display uploading, processing, analyzing,
analyzed, failed or cancelled states and the saved report when available.
Refresh does not cancel accepted background analysis.
Refresh during an unfinished byte transfer remains a separate recovery problem.

## Trust and deployment boundaries
The public API is in Toronto (`northamerica-northeast2`).
Video worker, collector and scheduler are in Montréal (`northamerica-northeast1`).
Private function invocation is IAM-controlled, not a browser API.
Task delivery and deployed revision need operator evidence before acceptance claims.

## Sources
- `docs/guides/vision-agent-api/04-video-reservation.md`
- `docs/guides/vision-agent-api/05-storage-transfer.md`
- `docs/guides/vision-agent-api/06-completion-and-reads.md`
- `docs/guides/vision-agent-api/12-architecture-implementation.md`
- `server/src/firebase.js`, `server/src/agent-video-media.js`
