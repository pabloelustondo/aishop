# Test 002 — Reject a request without authentication

Result: PASS — terminal response supplied by Pablo.
Environment: TEST, `aishop-99d36`.
Response timestamp: 2026-09-15 03:44:19 UTC.
Source commit / deployed revision: not verified by this request.

## What this tests

Does the private Agent analysis-list endpoint require authentication?
Unlike the public health route, it must refuse a request without a bearer token.
This request should not return anyone's records or create any data.

## Command

```sh
curl -i --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses'
```

No Authorization header is supplied intentionally.

## Expected result

HTTP 401 with error code `unauthorized`, a message requiring authentication,
and no analyses array. Capture the returned request reference if available.
HTTP 200 would fail this test; a 404 or 500 would not prove the expected gate.

## Observed result

```text
HTTP/2 401
cache-control: no-store
content-type: application/json; charset=utf-8
x-request-id: 9386a812-8944-4718-b189-8a1bbb3059c9
x-cloud-trace-context: 65eb25ce82bc84066f01880c80c34355;o=1
date: Tue, 15 Sep 2026 03:44:19 GMT
server: Google Frontend
content-length: 142

{"error":{"code":"unauthorized","message":"Authentication is required.","retryable":false,"requestId":"9386a812-8944-4718-b189-8a1bbb3059c9"}}
```

The supplied command includes Markdown link formatting; the plain URL above
is the reproducible command. This record relies on the supplied HTTP response.

## Interpretation and limits

The endpoint rejected this missing-token request and returned no analyses.
The error-body request reference matches the X-Request-ID header.
It does not prove valid sign-in, Agent/Admin claims, or isolation between owners.
Those require separate authenticated tests later in this exercise.
