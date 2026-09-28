# 04 — Authenticated request flow

The HTML loads Firebase Auth before loading the Agent JavaScript module.
`start()` subscribes to `firebase.auth().onAuthStateChanged()`.
Signed-out and signed-in regions are switched from that observed session state.

Before a protected request, `authorized()` reads `firebase.auth().currentUser`.
It calls `getIdToken()` and places the result in the Authorization header.
Multipart uploads let the browser create their own content-type boundary.
JSON operations explicitly send `Content-Type: application/json`.

The request uses a relative route such as `/v1/agent/analyses`.
Firebase Hosting forwards matching paths to the `api` function.
The server verifies the token, checks custom claims, and derives record ownership.
Client-side visibility never grants access; it only improves the experience.

`request()` parses the normal success or error envelope.
Network failures explain that no server reference exists.
Server failures retain the safe `requestId`, which the page can display and copy.

Implementation: [`02-web-ui/scripts/agent.js`](../../../../02-web-ui/scripts/agent.js).
