# 08 - Visual Source

## Core message
Photographs and videos enter through different API operations but become
owner-scoped analysis records read through one durable detail route.

## Composition
Use a 1600 by 900 canvas in the existing navy, teal and light palette.
At the top, show Firebase ID token and `agent: true` as one trust boundary.
Below, use two precise route lanes: JPEG and video.
Bring both lanes to the same record/detail endpoint.
Label API routes relative to the shared `/v1/agent` prefix.

## JPEG lane
Show multipart `POST /analyses`, optional `run=true` or `POST /analyses/{id}/run`,
then `GET /v1/agent/analyses/{id}` for progress and report.

## Video lane
Show `POST /video-uploads`, direct `PUT upload.uri` to Storage,
`POST /video-uploads/{id}/complete`, then the same detail GET.
Make the Storage transfer visibly separate from the authenticated API base.

## Boundary and caveat
Show `admin: true` only as a separate cross-user read boundary.
Mark original-source download as a known live gap, not a verified outcome.
Do not include passwords, real tokens, upload URLs, owner keys or analysis IDs.

## Source
`docs/guides/vision-agent-api/02-endpoints.md`, `07-images-and-runs.md`,
`developer-guide.md`, and `server/src/agent-api-handler.js`.

## Output
Generate `08-visual.svg` with editable SVG text and an exact route map.
Attach the full `08-notes.md` to the image slide in the next PPTX rebuild.
