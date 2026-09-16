# Diagnose failures and record acceptance

Test the direct API before Hosting, then repeat via Hosting to isolate rewrites.
A passing curl transfer does not prove browser CORS, chunking or local-session logic.
Do not automatically retry POST create/run/restart after an uncertain response.

| Last confirmed point | Next evidence |
|---|---|
| Authentication fails | Firebase REST error, token validity and claims |
| Reservation fails | API status, code and X-Request-ID |
| Storage PUT fails | HTTP code, Range and sanitized response reason |
| complete fails | API reference, object metadata and dispatch logs |
| processing persists | Video task delivery and worker execution logs |
| analyzing persists | Stored run diagnostics and collector/reconciler logs |
| analyzed | Report, frame provenance and original-source checksum |

Use the analysis ID and request references; do not rely on filename alone.
Public details expose status, version, runs and sanitized diagnostics.
A provider HTTP 200 can still contain incomplete or unusable output.
A ready Cloud Run revision does not prove a task was delivered.

## Read-only operator checks

These use gcloud operator credentials, separate from the application ID token.
```sh
gcloud functions describe processAgentVideo --gen2 --region northamerica-northeast1 --project aishop-99d36
gcloud run services get-iam-policy processagentvideo --region northamerica-northeast1 --project aishop-99d36
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="processagentvideo"' --project aishop-99d36 --freshness=1h --limit=30 --format=json
```

Inspect logs locally and sanitize before sharing; never post full capability URLs.
Queue permissions, queued deliveries, attempt IDs and handler results require
operator inspection; the public endpoint intentionally does not expose them.
Do not invoke the worker anonymously or grant public invocation for testing.

## Evidence to record per case

Date/time UTC, environment, source commit, deployed revision, media type,
byte length, analysis ID, HTTP status per step, redacted request reference,
state transitions, elapsed time and final report/checksum outcome.
Include failure bodies only after checking for secrets and private evidence.

## Automated gates and limits

From repository root: `npm --prefix server test` and `./e2e/server/run.zsh`.
The emulator uses synthetic users and provider responses; it is not live GPT QA.
Its Storage implementation does not prove production resumable chunk semantics.
Review current video E2E queue doubles/payloads after attempt-fencing changes.
This documentation turn ran no live uploads, mutations or acceptance tests.
