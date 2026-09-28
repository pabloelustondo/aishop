# 00 — Vision Agent Web UI

This presentation explains the browser code published from `02-web-ui/`.
Its main subject is the Vision Agent at `/agent.html`.
The administrator and inspection pages appear where they clarify shared boundaries.

The web client is deliberately simple: static HTML, CSS, and JavaScript modules.
Firebase Hosting serves those files and rewrites selected API paths to the server.
Firebase Authentication supplies the signed-in identity used on Agent requests.

The browser does not perform product recognition or persist authoritative state.
It selects files, transfers evidence, requests work, observes status, and renders reports.
Authorization, storage verification, background tasks, and OpenAI calls remain server-side.

The later slides connect visible page behaviour to files and responsibilities.
They explain current implementation, not a proposed framework migration.

Code entry point: [`02-web-ui/agent.html`](../../../../02-web-ui/agent.html).
Client controller: [`02-web-ui/scripts/agent.js`](../../../../02-web-ui/scripts/agent.js).
