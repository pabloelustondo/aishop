# Agent API — 1. Getting a token

The agent API accepts a Firebase ID token. There is no sign-up call and no API key: Pablo creates the
account and authorizes it ([operational-07](../../11-operational-reality/operational-07-agent-access-administration.md)).
Until the account carries the `agent` authorization, every route answers `403 forbidden`.

## What you need

- The account's email and password (created by Pablo in the Firebase Console as Email/Password).
- The project's public web API key, `{webApiKey}`. It identifies the project and authorizes nothing.
- Base URL on TEST: `https://aishop-99d36.web.app`.

## Sign in

```sh
curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={webApiKey}" \
  -H "content-type: application/json" \
  -d '{"email":"agent@example.com","password":"{password}","returnSecureToken":true}'
```

The answer carries `idToken` (valid for one hour), `refreshToken` and `expiresIn`. Send the ID token on
every agent call as `Authorization: Bearer {idToken}`.

## Renew without a password

```sh
curl -s -X POST "https://securetoken.googleapis.com/v1/token?key={webApiKey}" \
  -H "content-type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token={refreshToken}"
```

The answer's `id_token` is the new bearer. A refresh token stops working when Pablo revokes the account.

## What the server answers

| Situation | Status | `error.code` |
| --- | --- | --- |
| No token, expired token, revoked account | 401 | `unauthorized` |
| Valid token, account not authorized | 403 | `forbidden` |

A newly granted authorization is in the *next* token: sign in again after Pablo grants it. Sign-in
attempts are rate-limited by Firebase. Keep the password out of scripts you commit; read it from the
environment.
