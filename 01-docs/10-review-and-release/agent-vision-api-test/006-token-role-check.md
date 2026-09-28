# Test 006 — Inspect token role flags locally

Result: both roles true on post-grant repeat; initial false flags retained below.
Recorded on 2026-09-15 from Pablo's terminal output.

## Purpose

Explain the authorization denial in Test 005 without changing permissions.
Decode only the role flags in the token obtained in Test 004.
This local decode does not verify the token signature or query current account claims.

## Command

```sh
printf '%s' "$TOKEN" | node -e '
let token = "";
process.stdin.on("data", chunk => token += chunk);
process.stdin.on("end", () => {
  const claims = JSON.parse(
    Buffer.from(token.trim().split(".")[1], "base64url").toString()
  );
  console.log(JSON.stringify({
    agent: claims.agent === true,
    admin: claims.admin === true
  }, null, 2));
});
'
```

## Observed result

```json
{
  "agent": false,
  "admin": false
}
```

## Interpretation and next step

The token does not meet the Agent API's literal `agent: true` requirement.
This agrees with Test 005's HTTP 403; Firebase sign-in itself succeeded.
False here includes missing claims or values other than boolean true.
Admin access is independent and is not required to test the user's Agent list.
The token is a snapshot: inspect current account claims before deciding a grant is needed.
Any grant requires explicit authorization and a new ID token before retrying Test 005.
No credentials were recorded and no permissions were changed.

## Post-grant repeat

Pablo sourced `scripts/agent-api-tests/006-token-roles.sh` after signing in again.
Operator-supplied result:

```json
{"agent":true,"admin":true}
```

The new token contains both literal true flags. Test 005 separately verified
Agent endpoint access. Admin endpoint access remains to be tested.
