# 01 — Hosting boundary visual specification

## Diagram type
Deployment boundary diagram with three vertical zones.

## Zones
1. Browser: HTML, CSS, JavaScript, Firebase Auth session.
2. Firebase Hosting: static files and `/v1/...` rewrites.
3. Server platform: API, Storage, Firestore, Tasks, OpenAI adapter.

## Connectors
- Browser requests static assets from Hosting.
- Browser sends ID-token API calls through Hosting rewrites.
- Video transfer uses a separate dashed line to a Storage session URI.
- API calls private services and the external OpenAI system.

## Boundary labels
- Public static content
- Authenticated application API
- Server-owned durable work

Use solid arrows for ordinary requests and a dashed arrow for direct video transfer.
