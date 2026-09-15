# Vision Agent API Contract

The Agent owns shelf-analysis records behind Firebase access control.

## Photograph
- `POST /v1/agent/analyses` accepts one JPEG and creates a record.
- `run=true` or `POST /v1/agent/analyses/{id}/run` starts an eligible analysis.

## Video
- `POST /v1/agent/video-uploads` reserves an upload and returns a Storage session URI.
- The client sends bytes to Storage, then calls `POST /v1/agent/video-uploads/{id}/complete`.

## Reading
- `GET /v1/agent/analyses/{id}` restores server-owned progress and the report.
- Original evidence has a source route, but video download has a known live failure.

Agent ownership and Admin cross-user reads use different authorization claims.
