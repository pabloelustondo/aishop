# Sprint 008 Corrections — Test Deployment

Codex, 2026-09-07. Environment: TEST, Firebase project `aishop-99d36`.
Pablo explicitly authorized deployment after committing the corrections.
Source: `0bab4a7`; clean working tree at deployment start.

## Result

- `firebase deploy --only functions,hosting --project aishop-99d36`: exit 0.
- Predeploy VISTA configuration check passed; function and Hosting released.
- [Agent page](https://aishop-99d36.web.app/agent.html) and its JavaScript
  returned 200 and matched the committed local files byte-for-byte.
- Agent list/read, VISTA list and inspection submission routes returned
  expected 401 JSON responses without authentication.
- Command log: `/private/tmp/sprint008-corrections-deploy.log`.

## QA boundary

The corrected UI and server are deployed. Signed-in upload, live model
counts, refinement and retry behavior remain the user's manual QA pass.
Deployment checks made no paid provider call and no authenticated upload.
Codex made no commit or push; this deployment record is uncommitted evidence.
