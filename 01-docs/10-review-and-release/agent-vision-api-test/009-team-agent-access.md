# Step 009 — Team Agent access grants

Result: all six grants succeeded in Pablo's supplied terminal output.
Recorded on 2026-09-15. Environment: TEST, `aishop-99d36`.

## Purpose and procedure

Grant Agent access to the six existing accounts explicitly selected by Pablo.
For each email, Pablo ran the existing administration script:

```sh
node server/scripts/agent-access.mjs grant "$email" \
  --project aishop-99d36 --role agent
```

The loop stopped on any error and reached its final success message.
Expected: Agent true for each account; unrelated claims preserved.

## Observed results

| Account | Agent | Admin | Disabled |
|---|---|---|---|
| nachoriver@gmail.com | true | false | false |
| williams.martinez@arandanoestudio.com | true | false | false |
| santiago@elustondo.ai | true | false | false |
| rodrigo@elustondo.ai | true | false | false |
| pablo@elustondo.ai | true | true | false |
| willie@elustondo.ai | true | false | false |

These are operator-provided script results, not independent API access tests.
The script reads back account claims after each grant.
UIDs, passwords and tokens are intentionally omitted.

## Interpretation and next step

All selected accounts now report Agent access; Pablo's Admin role was preserved.
Users must obtain new ID tokens, normally by signing out and signing in again.
Repeat Test 005 with a newly obtained TOKEN before claiming authenticated API success.
Upload and analysis behavior remains untested by these grants.
The terminal also reported an export error in `.zshrc` line 2;
it did not stop these grants. Its cause has not been inspected or corrected.
