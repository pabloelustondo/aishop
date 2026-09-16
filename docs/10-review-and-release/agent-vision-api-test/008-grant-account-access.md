# Step 008 — Approved Agent and Admin access grant

Result: both claims granted and read back as true.
Date: 2026-09-15. Environment: TEST, project `aishop-99d36`.
Pablo explicitly authorized both roles for `pablo@elustondo.ai`.
Codex executed the existing administration script; this is a configuration
change and verification, not a successful authenticated API retest.

## Commands

```sh
node server/scripts/agent-access.mjs grant pablo@elustondo.ai \
  --project aishop-99d36 --role agent
node server/scripts/agent-access.mjs grant pablo@elustondo.ai \
  --project aishop-99d36 --role admin
node server/scripts/agent-access.mjs show pablo@elustondo.ai \
  --project aishop-99d36
```

## Result and boundaries

The first grant returned Agent true and Admin false.
The second grant returned both true; the independent show confirmed both true.
The account remained enabled. UID is omitted from this record.
Existing unrelated claims are preserved by the script.
These are AI Shop application roles, not Google Cloud IAM roles.
No Google Cloud project ownership or console administration was granted.

## Verification and next test

Firebase Console > Authentication > Users identifies the account.
Use the read-only show command above to verify custom claims via the Admin SDK.
The Firebase Users table is not a custom-claims role-management interface.
The old TOKEN remains unchanged: sign in again to obtain a new ID token,
then repeat Test 005. Preserve its original failed result.
Admin endpoint access has not yet been tested.

Reference: [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims).
