# Reserve one fresh video

Prerequisite: [authenticated terminal](03-authentication.md).
Begin with a fresh record to exclude old upload sessions and object conflicts.

```sh
VIDEO='/Users/paboelustodo/Downloads/VISTA_TEST_VIDEO_1.mp4'
MEDIA='video/mp4'
BYTES=$(stat -f%z "$VIDEO")
NAME=$(basename "$VIDEO")
CREATED=$(jq -n --arg name "$NAME" --arg media "$MEDIA" --argjson bytes "$BYTES"   '{fileName:$name,mediaType:$media,byteLength:$bytes}' |
  curl -sS --fail-with-body "$BASE/v1/agent/video-uploads"     -H "Authorization: Bearer $TOKEN" -H "Origin: $ORIGIN"     -H 'Content-Type: application/json' --data-binary @-)
ID=$(printf '%s' "$CREATED" | jq -er '.analysis.analysisId')
UPLOAD_URL=$(printf '%s' "$CREATED" | jq -er '.upload.uri')
printf '%s' "$CREATED" | jq '.analysis'
```

For MOV use mediaType video/quicktime and its actual path.
Expected HTTP 201: analysis.status uploading, a new ID, and a private upload URI.
No video bytes and no model request have been sent yet.
The required Origin header binds the Storage session to the browser origin.
The API validates declarations; the worker later validates video content.

## Negative tests

Repeat reservation with the Origin header omitted: expect 400 video_invalid.
Use mediaType application/pdf: expect 415 media_type_unsupported.
Use byteLength above 262144000: expect 413 file_too_large.
Use a fileName containing / or backslash: expect 400 video_invalid.
Missing token: 401; valid token without agent claim: 403.
These rejected declarations should not create a reservation.

Each successful reservation creates another record; there is no client
idempotency key for this create route. Do not blindly repeat a timed-out POST.
Read your list first to determine whether the original reservation exists.
Do not share CREATED: it contains the capability URL.
Do not trust the create response's version for later cancellation; fetch it again.
Continue with [Storage transfer](05-storage-transfer.md).
