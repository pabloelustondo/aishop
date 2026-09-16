# Terminal setup and authentication

Use an existing email/password Firebase account with Agent access.
This does not create users or grant claims. Google-only accounts need a
Firebase ID token obtained through their supported sign-in flow.
The Firebase web API key identifies the project; it is not the OpenAI secret.

```sh
BASE='https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api'
ORIGIN='https://aishop-99d36.web.app'
WEB_KEY=$(curl -fsS "$ORIGIN/__/firebase/init.json" | jq -er '.apiKey')
read 'TEST_EMAIL?Email: '
read -s 'TEST_PASSWORD?Password: '
printf '\n'
AUTH=$(printf '%s' "$TEST_PASSWORD" |
  jq -Rs --arg email "$TEST_EMAIL" '{email:$email,password:.,returnSecureToken:true}' |
  curl -sS --fail-with-body     "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$WEB_KEY"     -H 'Content-Type: application/json' --data-binary @-)
unset TEST_PASSWORD
TOKEN=$(printf '%s' "$AUTH" | jq -er '.idToken')
unset AUTH
```

Stop if authentication or jq fails. Do not print TOKEN or use shell tracing.
Sign in again if the token expires or claims changed. A gcloud access token
does not substitute for a Firebase ID token on these public application routes.

```sh
curl -i "$BASE/health"
curl -i "$BASE/v1/agent/analyses" -H "Authorization: Bearer $TOKEN"
curl -i "$BASE/v1/agent/analyses"
```

Expected: 200 with status ok; 200 with analyses; 401 without a token.
Using a signed-in account without agent:true must return 403.
That 403 is authorization, not an upload failure.
Bearer headers may be visible in local process inspection; use a trusted machine.
Never paste credentials or a full authentication response into review material.

Reference: [Firebase password sign-in REST API](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password).
For Admin tests, obtain ADMIN_TOKEN by this same flow using an admin account.
If this account has both claims, `ADMIN_TOKEN=$TOKEN` is sufficient.
