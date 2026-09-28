# Test 018 — Inspect retained source-download error

Result: no error body available — saved response independently verified as zero bytes.

```bash
source scripts/agent-api-tests/018-read-download-error.sh
```

Enter the temporary folder printed by Test 017 without quotes.
The script reads original-video as JSON and prints selected error fields.
URLs in the error message are redacted. It makes no network request.
If JSON parsing fails, report that failure; do not paste the raw file blindly.
Record code, message and requestId to guide server-side diagnosis.
The failed download is not evidence of missing source data until investigated.

## Observed result

Pablo supplied the correct temporary path via a here-string; the script printed nothing.
Codex inspected the exact saved original-video file in aishop-original.riYgaV
and confirmed its size is 0 bytes. jq processes empty input without printing a result.
The script now explicitly reports an empty response instead of remaining silent.
There is no error code/message or request ID to extract from this body.
Test 017's HTTP 500 remains the evidence; server logs are the next diagnostic source.
