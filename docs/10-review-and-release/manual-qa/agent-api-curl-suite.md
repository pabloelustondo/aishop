# Agent API curl suite

`agent-api-curl-suite.sh` exercises the documented contract in
[docs/guides/vision-agent-api](../../guides/vision-agent-api/README.md)
against TEST, from a terminal, with nothing between you and the server but
curl. Every check prints `PASS` or `FAIL` with the status it actually got; the
run continues past failures so one pass reports the whole picture. Exit 1 if
anything failed. Tokens, passwords and upload URLs are never printed.

## Run

```sh
AISHOP_TEST_EMAIL=you@example.com AISHOP_TEST_PASSWORD='…' \
AISHOP_VIDEO=~/Downloads/VISTA_TEST_VIDEO_1.mp4 \
bash docs/10-review-and-release/manual-qa/agent-api-curl-suite.sh
```

Optional: `AISHOP_ADMIN_EMAIL`/`_PASSWORD` for the admin section;
`AISHOP_OTHER_EMAIL`/`_PASSWORD` for a second agent account, which enables
the owner-isolation section; `AISHOP_SKIP_PROVIDER=1` to skip every step that
could spend on the provider; `AISHOP_POLL_SECONDS` (default 600).

The log lands in `build/curl-tests/<UTC>.log`, gitignored, with each response
truncated and any `uri`/`token` field redacted. Paste the summary or the path.

## What each section proves

1. **Health and auth** — 401 without a token, 404 for unknown ids, 200 with the
   agent claim.
2. **Photo** — upload, source bytes identical, non-JPEG rejected, run, refine
   requires context.
3. **Video reservation** — 201 fresh; 415/413/400 for wrong type, oversize,
   path in name, missing Origin.
4. **Storage transfer** — the direct-to-Storage leg, on its own. A fresh session
   inspects as 308 with 0 bytes; a whole-file PUT must be 200/201. **If this
   fails, the Storage body is printed** — that is the reason nobody had seen.
5. **Complete and process** — complete is 200 and idempotent; the record reaches
   `analyzed`; a refine on a video record passes the attempt fence.
6. **Recovery** — on a disposable reservation: renew, cancel, cancel again,
   renew-after-cancel refused, restart-without-evidence refused; cancelling a
   settled analysis reports it as already settled.
7. **Admin** — list, 403 for an agent token, 400 for a bad filter, 405 on write.
8. **Isolation** — another owner gets 404 on read, source, run and cancel.
9. **Cleanup** — every record the run created is cancelled if still active.

## Reading a failure

A `FAIL` line names the check, the statuses it accepted and the one it got,
followed by the first 200 bytes of the body. Section 4's failure prints more,
because that body is the diagnosis. Section 5's last check is the known
regression from the fail-closed attempt fence: `/run` on a video record must
pass the record's current attempt, and until it does this check fails.
