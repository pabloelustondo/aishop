# Complete, observe and retrieve evidence

Prerequisite: successful Storage PUT for this ID.
This POST verifies stored media type and byte length, marks processing and enqueues.
It can start billable analysis. It does not wait for a finished report.

```sh
curl -i -X POST "$BASE/v1/agent/video-uploads/$ID/complete"   -H "Authorization: Bearer $TOKEN"
curl -sS "$BASE/v1/agent/analyses/$ID"   -H "Authorization: Bearer $TOKEN" |
  jq '.analysis | {analysisId,status,version,failureReason,frames,runs,report}'
curl -sS "$BASE/v1/agent/analyses"   -H "Authorization: Bearer $TOKEN" | jq '.analyses'
```

Expected complete: HTTP 200, normally processing. Later reads show analyzing,
then analyzed with a report, or failed with a reason.
Repeat the single GET every 15 seconds; stop at a terminal state.
The transient uploaded state may appear between extraction and provider start.
An API 200 is not proof of task delivery or provider success.

## Original-source endpoint

Run after the original has been stored. Use a new temporary destination:
```sh
QA_DIR=$(mktemp -d)
curl -fS "$BASE/v1/agent/analyses/$ID/source"   -H "Authorization: Bearer $TOKEN" --output "$QA_DIR/original-video"
cmp "$VIDEO" "$QA_DIR/original-video"
```

Expected HTTP 200 and cmp exit 0: original bytes preserved exactly.
Video responses stream bytes; range serving is not implemented (Accept-Ranges: none).
Status reads return JSON with ISO timestamps. A missing/unowned detail ID is 404.
Repeat detail and source with a different Agent's token: expect 404.
The owner list must not expose another user's record.
The Agent list currently returns a bounded list, not a paginated admin-style page.

## Repeat-completion test

On a disposable record, repeat complete and inspect record/tasks for duplicates.
Later states return the current record; uploading/processing paths may dispatch.
This is a race test, not a promise that every concurrent completion answers 200.
A missing object can return storage_unavailable; mismatched bytes return video_invalid.
For processing/analyzing stalls see [diagnostics](10-diagnostics.md).
