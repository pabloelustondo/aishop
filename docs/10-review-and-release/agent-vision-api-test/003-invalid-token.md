# Test 003 — Reject an invalid bearer token

Result: PASS — terminal response supplied by Pablo.
Environment: TEST, Firebase project `aishop-99d36`.
Response timestamp: 2026-09-15 03:46:33 UTC.
Source commit / deployed revision: not verified by this request.

## Purpose

Verify that an Authorization header containing an invalid token does not
grant access to the private analysis list. Header presence alone is insufficient.
This request should create no records or provider work.

## Command

```sh
curl -i --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses' \
  -H 'Authorization: Bearer not-a-valid-token'
```

Expected: HTTP 401, error code unauthorized, no analyses array.
The token above is deliberately invalid test text, not a credential.

## Observed response

```text
HTTP/2 401
cache-control: no-store
content-type: application/json; charset=utf-8
x-request-id: 4b90a666-62ef-4872-9000-6205a305e355
x-cloud-trace-context: 4a22622c247f9b2684779d4d523de8b1;o=1
date: Tue, 15 Sep 2026 03:46:33 GMT
server: Google Frontend
content-length: 142

{"error":{"code":"unauthorized","message":"Authentication is required.","retryable":false,"requestId":"4b90a666-62ef-4872-9000-6205a305e355"}}
```

The pasted command contained Markdown link formatting; the command above
uses the intended plain URL. Evidence is the operator-supplied response.

## Interpretation

The API refused this invalid token and disclosed no analysis records.
The body request reference matches the X-Request-ID header.
This does not yet test valid sign-in, expired tokens, role claims or ownership.
Next: Test 004, obtaining a valid Firebase ID token via email/password sign-in.
