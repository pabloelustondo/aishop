# Authenticated Agent Request

1. Firebase Auth reports the signed-in browser user.
2. `authorized()` requests the user's current ID token.
3. The browser sends `Authorization: Bearer …` to `/v1/agent/...`.
4. Hosting rewrites the path to the server API.
5. The server verifies identity and the literal `agent: true` claim.
6. The browser renders the response or its safe diagnostic reference.

The server remains the authorization boundary.
