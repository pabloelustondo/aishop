# Sprint 014 video deployment

Status: PROPOSED. No deployment or bucket configuration is implied by this record.

## What local validation proves

- Unit and emulator gates exercise reservation, delegated Storage upload, FFmpeg extraction, one background response, durable collection, source retrieval and authorization.
- A real iPhone QuickTime file was inspected locally without retaining it: 154,701,233 bytes, 77.5 seconds, H.264, 1920 × 1080; 12 frames extracted in about 1.3 seconds on the development Mac.
- Local success does not prove the Linux function can execute the bundled FFmpeg binary or that production Storage accepts browser chunk/resume semantics.

## Separately approved TEST recipe

1. Confirm the branch commit, clean tree and `storage.cors.json` origins.
2. Apply bucket CORS: `gcloud storage buckets update gs://aishop-99d36.firebasestorage.app --cors-file=storage.cors.json`.
3. Deploy functions and Hosting: `firebase deploy --only functions,hosting --project aishop-99d36`.
4. Confirm `processAgentVideo` exists in Montréal and the public API remains in Toronto.
5. Sign in as an Agent; upload the approved small fixture, then the approved real iPhone fixture.
6. During each run refresh at `processing` or `analyzing`; confirm one record and one provider response.
7. Verify terminal report, original playback, All Runs visibility and redacted diagnostics.
8. Record deployed revision, request/analysis references, elapsed times and observed failure codes in the dated QA run.

## Operational cautions

- The resumable URI is a temporary write capability and must not enter logs or QA records.
- Source videos and frames remain private evidence; never copy sensitive metadata into documentation.
- The video task is 2 GiB/540 seconds with one concurrent dispatch; collection remains the existing server-owned Cloud Tasks flow.
- Any IAM, billing, security, deletion or production action still requires Pablo's explicit approval.
