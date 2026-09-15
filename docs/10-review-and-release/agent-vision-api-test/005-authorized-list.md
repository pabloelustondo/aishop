# Test 005 — Read the Agent list with a valid token

Result: PASS on post-grant retry; initial HTTP 403 retained below.
Environment: TEST, Firebase project `aishop-99d36`.
Recorded on 2026-09-15; precise response time and deployed revision not captured.

## Purpose

Test whether the account authenticated in Test 004 is authorized for the Agent
API and can read its list. Authentication alone does not grant Agent access.
Use the same terminal, which holds TOKEN. This request starts no analysis.

## Command

```sh
curl -sS --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses' \
  -H "Authorization: Bearer $TOKEN" \
  -w '\nHTTP status: %{http_code}\n' \
  | jq -Rrs 'split("\nHTTP status: ") as $parts | ($parts[0] | fromjson) as $body | {httpStatus:($parts[1] | tonumber),hasAnalyses:($body.analyses | type == "array"),analysisCount:(if ($body.analyses | type) == "array" then ($body.analyses | length) else null end),error:($body.error // null)}'
```

The output deliberately omits filenames, reports and source data.
Expected: httpStatus 200, hasAnalyses true, error null; zero records is valid.
403 means the account lacks Agent authorization; 401 means token rejection.
Do not share TOKEN. If parsing fails, report that error without printing credentials.

## Observed result and interpretation

```json
{
  "httpStatus": 403,
  "hasAnalyses": false,
  "analysisCount": null,
  "error": {
    "code": "forbidden",
    "message": "The account is not authorized for the agent.",
    "retryable": false,
    "requestId": "842df9df-89a3-45bb-961f-0b723eda7ff0"
  }
}
```

Test 004 established successful sign-in; this request was denied at the Agent
authorization gate. The verified identity did not meet the literal agent:true
requirement. No private analyses were returned.
This is an account-access blocker, not evidence of a video upload defect.
It does not prove that access denial is incorrectly configured: intended account
roles must be confirmed. Email/password and Google sign-in may identify different users.
Next: inspect only the token's role booleans locally; any role grant is a separate action.
No permissions were changed. Preserve this result when recording a later retry.

## Post-grant retry — PASS

After the approved role grants and a new sign-in, Pablo sourced
`scripts/agent-api-tests/005-authorized-list.sh` in the same Bash session.
Operator-supplied output:

```json
{
  "httpStatus": 200,
  "hasAnalyses": true,
  "analysisCount": 0,
  "error": null
}
```

The authenticated Agent list request succeeded and returned an empty array.
Zero records is valid for this account; this is not a cross-user inventory.
This verifies Agent list access, not Admin access, uploads or background processing.
Exact retry time and deployed revision were not captured.
