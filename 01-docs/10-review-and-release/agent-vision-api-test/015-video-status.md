# Test 015 — Read video processing status

Result: PASS — operator-supplied status analyzed with a report and no failure.

```bash
source scripts/agent-api-tests/015-video-status.sh
```

This performs one authenticated GET for the existing analysis ID.
It does not trigger or restart processing. No report contents are printed.
Expected HTTP 200. Processing/analyzing are nonterminal states;
analyzed indicates completion and should have a report. Failed needs investigation.
If still processing, wait at least 15 seconds before another read.
Stop polling at a terminal state; do not repeatedly call the completion endpoint.
Even a completed report requires manual content review before quality acceptance.

## Observed result

Pablo supplied:

```json
{
  "httpStatus": 200,
  "analysisId": "0621956927cd49e4b59b43704b2a0b67",
  "status": "analyzed",
  "failureReason": null,
  "hasReport": true,
  "error": null
}
```

The fresh post-ACL-fix reservation, Storage transfer, completion request and
final status read succeeded for IMG_3381.MOV through the direct API workflow.
The server reports completed analysis with a report; report accuracy has not
been reviewed. No precise processing duration or provider usage was captured.
This does not validate browser upload/CORS, resumable chunks or every video input.
