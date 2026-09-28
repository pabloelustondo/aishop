# Test 014 — Complete upload and start processing

Result: PASS for completion acknowledgment; analysis outcome remains unverified.

After Test 013 confirmed Storage completion, run in the same Bash session:

```bash
source scripts/agent-api-tests/014-complete-video.sh
```

This POST verifies the stored video and requests background processing.
It can initiate billable AI work. It is not a read-only test.
Expected: HTTP 200 and an analysis status, normally processing.
It does not wait for a report. Worker and model success require later status reads.
On timeout, read the record before retrying; do not assume the POST did nothing.
Never print TOKEN or the private upload session URL.

## Observed result

Pablo supplied:

```json
{
  "httpStatus": 200,
  "analysisId": "0621956927cd49e4b59b43704b2a0b67",
  "status": "processing",
  "error": null
}
```

The API acknowledged completion and returned processing, not a finished report.
Response speed does not measure video extraction or model-analysis duration.
