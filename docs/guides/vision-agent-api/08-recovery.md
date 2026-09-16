# Recovery endpoint tests

Use separate disposable IDs; do not cancel somebody else's existing test.
Cancellation retains history/evidence. Start fresh is client orchestration:
cancel the old upload, then POST video-uploads for a new ID; no /fresh route exists.

## Renew an uploading record's Storage session

```sh
RENEWED=$(curl -sS --fail-with-body -X POST   "$BASE/v1/agent/video-uploads/$ID/session"   -H "Authorization: Bearer $TOKEN" -H "Origin: $ORIGIN")
UPLOAD_URL=$(printf '%s' "$RENEWED" | jq -er '.upload.uri')
```

Expected 201 while uploading; 409 after leaving uploading; missing Origin: 400.
The new session does not promise retained bytes from the old one.
If the source object already exists, finalization can conflict with its precondition.

## Cancel using the latest record version

```sh
VERSION=$(curl -fsS "$BASE/v1/agent/analyses/$ID"   -H "Authorization: Bearer $TOKEN" | jq -er '.analysis.version')
curl -i -X POST "$BASE/v1/agent/analyses/$ID/cancel"   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json'   --data "{\"version\":$VERSION}"
```

Expected outcome cancelled and status cancelled; inspect cleanup separately.
A stale version can answer 200 changed. Completion saved first: already-settled.
Repeat with a freshly read version: already-cancelled; no duplicate cleanup.
Missing version is currently accepted, but explicit versions make tests precise.
Malformed version: 400 context_invalid (current shared validation code).
Other owner: 404; no agent claim: 403. Verify the target record did not change.
Test cancellation independently at uploading, processing and analyzing.

## Restart

For a video cancelled after complete source evidence was recorded:
```sh
VERSION=$(curl -fsS "$BASE/v1/agent/analyses/$ID"   -H "Authorization: Bearer $TOKEN" | jq -er '.analysis.version')
curl -i -X POST "$BASE/v1/agent/analyses/$ID/restart"   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json'   --data "{\"version\":$VERSION}"
```

Expected restarted/processing with a new attempt; current code re-extracts frames.
Cancelled mid-upload or an ineligible state: 409. Stale version: 200 changed.
Poll to terminal; verify old-attempt results cannot settle the restarted record.
