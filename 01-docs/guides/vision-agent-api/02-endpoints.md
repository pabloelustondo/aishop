# Endpoint map

Direct base: `https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api`.
Hosting base for /v1 routes: `https://aishop-99d36.web.app`.
The direct base bypasses Hosting rewrites. /health is tested on the direct base.
Opening a URL in a browser does not supply the required bearer token.

| Method | Path relative to base | Expected success |
|---|---|---|
| GET | /health | 200, status ok; no authentication |
| POST | /v1/agent/video-uploads | 201, analysis and upload.uri |
| POST | /v1/agent/video-uploads/{id}/session | 201, replacement upload.uri |
| POST | /v1/agent/video-uploads/{id}/complete | 200, analysis |
| GET | /v1/agent/analyses | 200, analyses array |
| GET | /v1/agent/analyses/{id} | 200, analysis |
| GET | /v1/agent/analyses/{id}/source | 200, private binary evidence |
| POST | /v1/agent/analyses | 201, JPEG analysis record |
| POST | /v1/agent/analyses/{id}/run | 200, analysis; may still be analyzing |
| POST | /v1/agent/analyses/{id}/cancel | 200, outcome and analysis |
| POST | /v1/agent/analyses/{id}/restart | 200, outcome and analysis |
| GET | /v1/admin/analyses | 200, analyses and nextCursor |
| GET | /v1/admin/analyses/{ownerKey}/{id} | 200, analysis with owner label |
| GET | /v1/admin/analyses/{ownerKey}/{id}/source | 200, private binary evidence |

All Agent routes require agent authorization; all Admin routes require admin.
Storage PUT uses the exact dynamically returned session URI, not either base.
The URI grants upload capability; do not attach the Firebase bearer token to it.
API errors use `{error:{code,message,retryable,requestId}}`.
Inspect HTTP status and outcome: HTTP 200 cancellation can mean changed/already-settled.
API responses carry X-Request-ID; preserve it with the analysis ID for investigation.

## Private functions, not browser endpoints

- processAgentVideo: task payload ownerKey, analysisId, attemptId.
- collectAgentAnalysis: collection task carries owner, analysis, run and attempt.
- reconcileAgentAnalyses: scheduler finds due collection work.
- Their invocation is IAM-controlled; do not make them public for curl testing.
- Exercise them through complete/run and subsequent GETs, then inspect logs.

No public collect endpoint or admin bulk-cancellation endpoint exists here.
Source: [Agent router](../../../server/src/agent-api-handler.js),
[Admin router](../../../server/src/admin-api-handler.js),
[Hosting rewrites](../../../firebase.json).
