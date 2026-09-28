# 02 — Hosted page map

The Hosting root contains four related but distinct browser applications.

[`02-web-ui/agent.html`](../../../../02-web-ui/agent.html) is the Vision Agent.
It uses `scripts/agent.js`, `styles/base.css`, and `styles/agent.css`.
It lists only the signed-in owner's analyses and offers actions that can start work.

[`02-web-ui/allruns.html`](../../../../02-web-ui/allruns.html) is the admin companion.
It reuses Agent record styling but uses `scripts/allruns.js` for read-only cross-owner queries.
The server requires the independent `admin: true` claim.

[`02-web-ui/index.html`](../../../../02-web-ui/index.html) is the inspection reviewer.
Its controller, API adapter, and rendering are split across `app.js`, `api.js`, and `view.js`.
It can display older inspections and VISTA evidence packages.

[`02-web-ui/catalog.html`](../../../../02-web-ui/catalog.html) is the catalog browser.
It reads the static catalog JSON and local product images.

These pages share Hosting and base visual language, not one client controller or one API contract.
