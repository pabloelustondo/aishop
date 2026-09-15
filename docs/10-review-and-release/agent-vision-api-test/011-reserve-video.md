# Test 011 — Reserve one video upload

Result: PASS — operator-supplied HTTP 201.
Environment: TEST, aishop-99d36.

## Purpose and command

Isolate reservation from byte transfer and background processing.
Use the existing authenticated Bash session:

```bash
source scripts/agent-api-tests/011-reserve-video.sh
```

Enter the actual full MP4 or MOV path without quotes at the prompt.
The script derives the filename, actual byte length and declared media type.
It creates one server record and a private Storage session, but uploads no
video bytes and starts no model analysis.

## Expected and safety

HTTP 201, status uploading, analysisId present, hasUploadSession true, error null.
The session URL is deliberately hidden and retained only in this Bash session.
Keep the terminal open for the separate transfer test; never paste UPLOAD_URL.
Do not blindly repeat after a timeout: creation is not client-idempotent.
Read the Agent list to check for an existing reservation first.
This does not validate actual video content, transfer, CORS or processing.
## Observed result

Pablo selected `/Users/paboelustodo/Downloads/IMG_3381.MOV` and supplied:

```json
{
  "httpStatus": 201,
  "analysisId": "45c9f219c90244f284f3c31f622c76b8",
  "status": "uploading",
  "hasUploadSession": true,
  "error": null
}
```

Reservation succeeded. No bytes or model analysis are proven by this response.
The private session URL was not included in the evidence.
