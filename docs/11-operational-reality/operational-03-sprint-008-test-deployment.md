# Sprint 008 — Test Deployment, 2026-09-07

## Identity and authority

- Environment: TEST, Firebase project `aishop-99d36`.
- Source commit: `d596e3539f95679b9b116fdff67019d8360fdb78`.
- Pablo explicitly requested deployment for QA in this session, overriding the sprint's original deployment exclusion for this run.
- Deployable files matched that commit before and after deployment. Concurrent benchmark documentation changes were not deployment inputs.

## Execution and verification

- `firebase deploy --only functions,hosting --project aishop-99d36`: exit 0; function update and Hosting release succeeded.
- The predeploy VISTA startup-limit check passed.
- Secret metadata checked before deployment: `OPENAI_API_KEY` version 1 enabled; `AI_SHOP_CLIENT_TOKEN` version 3 enabled. No secret values were displayed.
- [Agent page](https://aishop-99d36.web.app/agent.html) and its JavaScript returned 200 and matched local committed contents byte-for-byte.
- Hosted agent collection and single-record GET routes returned 401 without credentials.
- Hosted VISTA collection GET and `/inspections` POST also returned 401 JSON responses, confirming those rewrites still reach authentication.
- Local temporary command log: `/private/tmp/sprint008-deploy.log`.

## Evidence boundary

- This is a limited QA deployment with the agreed corrections still unimplemented, not sprint acceptance.
- No authenticated upload, provider call, successful refinement, recognition-quality assessment, or second-account browser check was performed by Codex during deployment.
- Known defects remain: failed-refinement Retry loses context; blank refinement permits a paid rerun; application error logs retain caller-controlled paths.
- Start QA with sign-in, a shelf JPEG upload and automatic facing counts, then a nonblank refinement such as “ignore the top shelf”. Avoid the known blank-refinement defect.
- No code edits, commits, pushes, or merges were performed by Codex.
