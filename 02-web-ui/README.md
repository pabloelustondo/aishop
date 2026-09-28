# Dashboard web clients

## Purpose
Firebase Hosting publishes this directory as AI Shop's static browser client.
The pages use plain HTML, CSS, and JavaScript modules without a bundling step.

## Pages
- `agent.html` is the owner-scoped Vision Agent upload and results page.
- `allruns.html` is the read-only cross-owner administrator page.
- `index.html` reviews older inspections and VISTA evidence packages.
- `catalog.html` browses the static product catalog.

## Vision Agent files
- `scripts/agent.js` owns authentication, requests, rendering, and recovery.
- `styles/agent.css` owns the Agent layout and analysis-card presentation.
- `styles/base.css` supplies shared typography, controls, and message styling.
- `scripts/allruns.js` and `styles/allruns.css` implement the admin companion.

## Other client modules
- `scripts/app.js` coordinates the inspection-review application.
- `scripts/api.js` calls inspection and VISTA-package endpoints.
- `scripts/view.js` renders inspection evidence and review state.
- `scripts/catalog.js` renders `catalog/catalog.json` and its local images.

## Runtime boundary
Firebase SDK scripts provide browser authentication at runtime.
Authenticated requests use same-origin `/v1/...` routes rewritten to `api`.
Server authorization, storage, task processing, and AI execution live in `server/`.
Browser-behaviour tests live under `server/test/` and import pure client helpers.

## Deployment
`firebase.json` declares `02-web-ui/` as the Hosting public directory.
JavaScript, CSS, and HTML are served with `Cache-Control: no-cache`.
The current Hosting ignore list does not exclude Markdown files.

See the [Web UI low-level design](../01-docs/08-low-level-design/082-web-ui/README.md).
