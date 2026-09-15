# 081 - Visual Source

## Core message
Once the source video is complete, private server workers prepare frames,
start one background model response, and settle a durable report.

## Composition
Use a 1600 by 900 canvas and the established teal/navy styling.
Show two ownership levels: public client/API/Storage flow above and
private task/worker/collector flow below.
Use exact service names and operations rather than arbitrary icons.

## Public path
Reserve with API, PUT bytes to Storage, complete with API.
Make clear that POST complete returns a processing record, not a final report.

## Private path
Cloud Tasks invokes `processAgentVideo` with attempt ID.
FFmpeg extracts timestamped JPEG frames from one source video.
One OpenAI background response analyzes those frames as one shelf scan.
`collectAgentAnalysis` retrieves and settles the report in Firestore.
The reconciler only schedules overdue collection, not all recovery work.

## Read path
Show `GET /v1/agent/analyses/{id}` reading durable Firestore state.
The client can close or refresh after accepted processing.

## Accuracy boundary
Cross-frame duplicate prevention is a prompt and report contract.
Do not present it as measured accuracy without human-verified video reference.
Keep sampled-frame timestamps visible in the diagram.

## Source
`docs/guides/vision-agent-api/12-architecture-implementation.md` and
`server/src/firebase.js`.

## Output
Generate `081-visual.svg` with editable labels.
Attach `081-notes.md` to its image slide in the PPTX.
