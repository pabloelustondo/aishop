# Sprint 009 — Verified UI Deployment

Codex, 2026-09-07. Environment: TEST `aishop-99d36`.
Pablo explicitly requested deployment. Source commit: `4f0b0c1`.
Working tree was clean at deployment start.

## Deployment and checks

- `firebase deploy --only functions,hosting --project aishop-99d36`: exit 0;
  function and Hosting releases succeeded; predeploy limits check passed.
- Hosted `agent.html`, `scripts/agent.js` and `styles/agent.css` returned
  200 and matched the committed files byte-for-byte.
- Agent list/read/source, VISTA list and inspection submission returned
  expected 401 JSON responses without credentials.
- Chrome loaded the actual hosted HTML/JS/CSS with synthetic identity and
  report/image responses: 1440 px side-by-side and 900 px stacked layouts
  passed, with no horizontal overflow or page errors. Keyboard evidence
  tooltips passed. This was not authenticated live-data acceptance testing.
- [Open the deployed agent](https://aishop-99d36.web.app/agent.html).
- Temporary evidence: `/private/tmp/sprint009-deploy.log` and
  `/private/tmp/sprint009-live-agent-{1440,900}.png`.

## QA boundary

The full-width UI, source-image route and reviewed corrections are live.
Real sign-in, upload, provider quality and refinement remain manual QA.
No paid provider call, real-secret edit, commit or push was performed here.
