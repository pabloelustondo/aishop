# Test 001 — Direct API health

Result: PASS, based on the terminal response supplied by Pablo.
Environment: TEST, `aishop-99d36`.
Response timestamp: 2026-09-15 03:39:39 UTC.
Source commit / deployed revision: not verified by this request.

## What this tests

Can the deployed API be reached from Pablo's terminal and answer its health route?
This is the first connectivity check before testing private or processing routes.
The request goes directly to Cloud Functions, bypassing Firebase Hosting and UI.
It requires no authentication and does not upload evidence or start analysis.

## Command

```sh
curl -i --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/health'
```

The flags show response headers, allow 10 seconds to connect, and cap the
whole curl request at 30 seconds. They are client test limits, not AI timeouts.
The pasted command contained Markdown link formatting; the command above is
the intended plain-URL version. The response below is the supplied evidence.

## Expected result

HTTP 200 and JSON `{"status":"ok"}`.

## Observed result

```text
HTTP/2 200
cache-control: no-store
content-type: application/json; charset=utf-8
x-cloud-trace-context: 315614353cabbc44b1d666419bdb1af2;o=1
date: Tue, 15 Sep 2026 03:39:39 GMT
server: Google Frontend
content-length: 15

{"status":"ok"}
```

## Interpretation and limits

The direct API was reachable and its health handler returned the expected response.
This does not test Firebase authentication, access rights, Firestore, Storage,
video upload, Cloud Tasks, FFmpeg or OpenAI. It is not an end-to-end success.
The response contains no timing measurement or deployed revision identifier.
Next: [Test 002 — Missing authentication](002-missing-authentication.md).
