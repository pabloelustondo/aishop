# 04 — Request sequence specification

## Diagram type
UML sequence diagram.

## Participants
- Person
- `agent.html`
- `agent.js`
- Firebase Auth
- Firebase Hosting
- Agent API

## Sequence
1. Person triggers an action.
2. `agent.js` asks Firebase Auth for an ID token.
3. `agent.js` sends a relative request with the bearer token.
4. Hosting rewrites the request to the API.
5. API verifies identity and role before reading or changing state.
6. API returns data or a safe error envelope.
7. `agent.js` updates the visible page and diagnostic message.

Mark Firebase Auth and the Agent API as external to the static page bundle.
