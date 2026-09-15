# Test 013 — Inspect the existing Storage upload session

Result: diagnostic captured — HTTP 400 identifies an ACL/uniform-access conflict.

## Purpose and command

After Test 012 returned 400 invalid, query the same session with an empty PUT
and Content-Range bytes */TOTAL. No video bytes or new reservation are sent.

```bash
source scripts/agent-api-tests/013-inspect-upload-session.sh
```

Use the same Bash session. Output includes HTTP status, acknowledged Range,
and a parsed error code/message if available. URLs in messages are redacted.

## Interpretation

308: incomplete; Range reports acknowledged bytes, absent Range means none.
200/201: Storage reports completion.
404/410: session unavailable; do not reuse blindly.
Other errors require their returned details. This is a new status request,
so its response cannot recover the original transfer error message.
Do not call the completion endpoint until final byte storage is established.

## Observed result and code trace

Pablo supplied HTTP 400, range null, storageCode invalid and this message:
"Cannot insert legacy ACL for an object when uniform bucket-level access is enabled."
The documentation URL was redacted by the script.

Local `server/src/agent-evidence-store.js` passes `private: true` to
`createResumableUpload` in createVideoUploadSession. This requests a legacy ACL.
The unit test currently asserts that option instead of rejecting it.
This code is consistent with the explicit Storage error; deployed source parity
was not independently checked in this diagnostic.
The status request identifies the session conflict, not a timeout or model limit.

Recommended correction: omit the legacy ACL option, retain uniform bucket access,
origin binding and generation precondition, and add regression coverage.
Do not disable uniform access or grant public permissions as a workaround.
After deployment, test a fresh session; the old session may retain the ACL option.
No executable code or bucket permissions were changed in this diagnostic.

Reference: [Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access).
