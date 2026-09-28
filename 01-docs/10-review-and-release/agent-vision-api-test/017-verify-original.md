# Test 017 — Verify original video preservation

Result: FAIL — operator-supplied HTTP 500; checksum comparison skipped.

## Purpose and command

Verify that the original-source endpoint returns the same bytes as the local video.
Use the same authenticated Bash session, with ID and VIDEO from reservation:

```bash
source scripts/agent-api-tests/017-verify-original.sh
```

GET /v1/agent/analyses/:id/source downloads the stored original.
The script creates a unique temporary folder and prints its location.
It never overwrites the local source and performs no server mutation or AI work.
The download remains there for inspection; it may contain private material.

## Expected and interpretation

HTTP 200 and identical true, with matching local and downloaded SHA-256 values.
An HTTP failure skips comparison; the response is retained for inspection.
A mismatch requires checking whether the local source changed since upload,
whether the intended analysis was selected, or whether storage altered the data.
This compares against the current local file, not a separately captured upload-time hash.
It does not validate report accuracy, video playback or access isolation.
## Observed result

Pablo supplied HTTP 500. The script correctly skipped checksum comparison.
The response was retained in temporary folder `aishop-original.riYgaV`
under the local macOS temporary directory, as file `original-video`.
No matching or mismatching checksum result exists for this attempt.
Report retrieval previously succeeded, but original-source retrieval now failed.
The status alone does not identify the cause or prove that stored bytes are missing.
Next: inspect the retained error response before retrying the download.
