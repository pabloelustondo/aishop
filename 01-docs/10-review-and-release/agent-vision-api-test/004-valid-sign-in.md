# Test 004 — Valid email/password sign-in

Result: PASS — sanitized terminal output supplied by Pablo on 2026-09-15.
Environment: TEST, Firebase project `aishop-99d36`.

## Purpose

Verify that an existing email/password account can obtain a Firebase ID token.
This tests Firebase sign-in, not the application's Agent authorization.
The next test will use the token to read the private list.

## Command (macOS zsh, jq required)

```sh
WEB_KEY=$(curl -fsS --max-time 30 'https://aishop-99d36.web.app/__/firebase/init.json' | jq -er '.apiKey')
read 'TEST_EMAIL?Email: '
read -s 'TEST_PASSWORD?Password: '
printf '\n'
AUTH=$(printf '%s' "$TEST_PASSWORD" |
  jq -Rs --arg email "$TEST_EMAIL" '{email:$email,password:.,returnSecureToken:true}' |
  curl -sS --max-time 30 \
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$WEB_KEY" \
    -H 'Content-Type: application/json' --data-binary @-)
unset TEST_PASSWORD
TOKEN=$(printf '%s' "$AUTH" | jq -er '.idToken // empty')
printf '%s' "$AUTH" | jq '{signedIn:(.idToken != null),expiresIn,error:(.error.message // null)}'
unset AUTH
```

Use a trusted terminal without shell tracing. Enter the password at the hidden
prompt, never in a pasted command. Keep TOKEN in this terminal for the next test.
Share only the final sanitized JSON, never TOKEN or the raw AUTH response.
A Google-only account cannot use this password flow without a password credential.

## Expected and observed result

Expected: signedIn true, expiresIn present, error null.
Observed operator-supplied output:
```json
{"signedIn":true,"expiresIn":"3600","error":null}
```
Firebase accepted the credentials and returned an ID token with a reported
3,600-second lifetime. No password or token is retained in this record.
HTTP status and response timestamp were not captured by this command.
A valid sign-in does not prove agent:true, admin:true or access to any record.

Reference: [Firebase Auth REST](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password).

## Post-grant repeat using the saved script

Pablo started Bash and sourced `scripts/agent-api-tests/004-sign-in.sh`
after the role grants. Operator-supplied result:

```json
{"signedIn":true,"expiresIn":"3600","error":null}
```

Result: PASS for sign-in again. A new token was obtained in that Bash session;
its role flags and Agent list access have not yet been verified in this repeat.
No password or token is recorded. Next: source `005-authorized-list.sh`
in the same Bash session and retain Test 005's original 403 as historical evidence.
