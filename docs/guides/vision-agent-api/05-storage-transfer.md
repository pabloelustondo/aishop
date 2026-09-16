# Transfer bytes and inspect Storage

Prerequisite: ID, VIDEO, MEDIA, BYTES and UPLOAD_URL from reservation.
No Firebase Authorization header goes to Storage; the session URI is the capability.
Do not use curl -L: a 308 here means resumable progress, not a redirect.

## First isolation test: one complete PUT

```sh
curl -i -X PUT "$UPLOAD_URL"   -H "Content-Type: $MEDIA"   -H "Content-Range: bytes 0-$((BYTES - 1))/$BYTES"   --data-binary "@$VIDEO"
```

Expected 200 or 201. A 400 body is evidence: record its safe reason, not just status.
This tests whole-file acceptance, not chunk interruption or browser CORS behavior.
Only continue to complete after Storage confirms the final upload.

## Inspect an interrupted session

```sh
curl -i -X PUT "$UPLOAD_URL"   -H "Content-Range: bytes */$BYTES" --data-binary ''
```

308 means incomplete; Range: bytes=0-N acknowledges N+1 stored bytes.
No Range on 308 means zero acknowledged bytes. 200/201 means complete.
404/410 means the session is unavailable; use the renewal test on a disposable record.
Do not reuse an unavailable session. Other 4xx responses need their actual cause.

## Chunk acceptance test on a separate fresh reservation

For a video larger than 8 MiB, send its first 8 MiB:
```sh
head -c 8388608 "$VIDEO" | curl -i -X PUT "$UPLOAD_URL"   -H "Content-Type: $MEDIA"   -H "Content-Range: bytes 0-8388607/$BYTES" --data-binary @-
```

Expect 308 and inspect Range. For the next PUT start at the acknowledged offset,
not the requested end. Non-final chunk sizes should be multiples of 256 KiB.
Record every response before building an automated chunk loop.
400 range/length errors, 412 object precondition errors and 403 permission
errors are distinct failures; changing transfer strategy does not diagnose them.

Reference: [Google Storage resumable uploads](https://docs.cloud.google.com/storage/docs/performing-resumable-uploads).
