# Test 007 — Read current Firebase account roles

Result: diagnostic complete — account enabled; Agent and Admin flags false.
Environment: TEST, project `aishop-99d36`.
Recorded on 2026-09-15 from Pablo's terminal output.

## Purpose and command

Distinguish an outdated token from missing current account authorization.
The existing administration script's `show` action is read-only.
Use the same account as Test 004:

```sh
node server/scripts/agent-access.mjs show pablo@elustondo.ai \
  --project aishop-99d36
```

Expected diagnostic: account enabled and current role flags reported.
Agent access would require `claims.agent` to equal boolean true.

## Observed result

UID omitted from this evidence copy; other fields match supplied output.

```json
{
  "project": "aishop-99d36",
  "action": "show",
  "role": "agent",
  "disabled": false,
  "claims": {
    "agent": false,
    "admin": false
  }
}
```

## Interpretation

The account exists and is enabled, but lacks the required Agent flag.
The top-level `role: agent` is the script's selected role, not a granted claim.
Current account flags agree with Test 006's token flags and Test 005's 403.
Refreshing the token alone will not resolve this missing authorization.
No permissions were changed. Request Pablo's approval for Agent-only access;
Admin is independent and unnecessary for the current own-account tests.
After any approved grant, obtain a new token and repeat Test 005.
