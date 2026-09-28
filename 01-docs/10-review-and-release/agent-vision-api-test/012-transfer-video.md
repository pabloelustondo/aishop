# Test 012 — Transfer the reserved video to Storage

Result: post-fix upload completion confirmed by status query; original 400 retained.
Environment: TEST, aishop-99d36.

## Purpose and command

Isolate Storage byte transfer from the UI and the analysis pipeline.
In the same Bash session as successful reservation:

```bash
source scripts/agent-api-tests/012-transfer-video.sh
```

This performs one complete-file PUT to the private session URL.
It does not call the API completion endpoint or initiate model work.
It deliberately does not follow redirects or send a Firebase bearer token.
The five-minute curl deadline is a transfer-test limit, not an analysis limit.
The script prints status and a parsed Storage reason code when available;
raw responses and the session URL are not printed.

## Expected and boundaries

Expected HTTP 200 or 201. Storage error codes may be absent or unparsable.
HTTP 308 means incomplete; inspect acknowledged Range before continuing.
On timeout or failure, inspect the session before retrying or creating another.
This full-file test does not verify chunk-resume behavior or browser CORS.
Only proceed to completion after Storage confirms successful final upload.
## Observed result

Pablo ran the saved script and supplied:

```json
{"httpStatus":400,"storageCode":"invalid"}
```

Storage rejected the full-file request. Reservation had succeeded in Test 011.
The parsed code does not establish whether the cause is request shape, length,
session state or another validation error. No detailed message was captured.
Do not infer successful transfer or proceed to the completion endpoint.
Next: inspect this session without sending video bytes or reserving another one.

## Post-fix transfer

Pablo transferred the same MOV using fresh analysis
`0621956927cd49e4b59b43704b2a0b67` after deployment of the ACL correction.
The transfer script initially printed nothing: its jq XML fallback could produce
an empty stream for responses without an error. The parser was corrected.
No HTTP result is inferred from that blank output and the transfer was not repeated.
The subsequent Test 013 status query returned HTTP 200 with no error,
confirming the session had completed its upload. AI processing is not yet tested.
