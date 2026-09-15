# Vision Agent API — guided curl test record

Environment: TEST, Firebase project `aishop-99d36`.
Exercise started: 2026-09-15 UTC. Operator: Pablo; assisted by Codex.

## Purpose

Test the API one request at a time, independently of the browser UI.
For each test, explain the question it answers, run the command, inspect
the response, and record a bounded conclusion before advancing.

## Test index

| Test | Purpose | Result |
|---|---|---|
| [001 — Health](001-health.md) | Can the direct API answer a basic request? | PASS — operator-provided response |
| [002 — Missing authentication](002-missing-authentication.md) | Does the private list reject an unauthenticated request? | PASS — operator-provided response |
| [003 — Invalid token](003-invalid-token.md) | Does the private list reject an invalid bearer token? | PASS — operator-provided response |
| [004 — Valid sign-in](004-valid-sign-in.md) | Can an existing account obtain an ID token? | PASS — operator-provided response |
| [005 — Authorized list](005-authorized-list.md) | Can the signed-in account access its Agent list? | PASS — 200 after grant/new token; original 403 retained |
| [006 — Token role check](006-token-role-check.md) | Does this token carry Agent or Admin access? | Both true after new sign-in; original false flags retained |
| [007 — Account role check](007-account-role-check.md) | Are current Firebase roles different from the token? | Diagnostic — enabled; both roles false |
| [008 — Approved role grants](008-grant-account-access.md) | Grant and verify both requested application roles | Verified — both true; API retest pending |
| [009 — Team Agent grants](009-team-agent-access.md) | Grant Agent access to six selected accounts | Success — operator-provided results |
| [010 — Admin list](010-admin-list.md) | Can the token read the cross-user Admin list? | PASS — 200; 13 records on returned page |
| [011 — Reserve video](011-reserve-video.md) | Can the API reserve a fresh video upload? | PASS — 201; uploading |
| [012 — Transfer video](012-transfer-video.md) | Can Storage accept the complete video? | FAIL — 400; invalid |
| [013 — Inspect upload session](013-inspect-upload-session.md) | What state does Storage report after failure? | 400 — legacy ACL conflicts with uniform bucket access |

## Evidence conventions

- Each numbered Markdown document contains purpose, command, expected result,
  observed result, explanation and what remains untested.
- Record response time in UTC when supplied by the HTTP Date header.
- Distinguish operator-pasted evidence from independently executed checks.
- Pending means no result received; it never counts as a pass.
- Record failed attempts before retries; do not overwrite failures with success.
- Never include bearer tokens, passwords or resumable upload URLs.
- Identify source commit and deployed revision only when verified for that run.
- Test 001 alone does not establish upload, database, worker or AI health.

Reference: [API guide](../../guides/vision-agent-api/README.md).
This collection records execution evidence; the guide describes the contract.
