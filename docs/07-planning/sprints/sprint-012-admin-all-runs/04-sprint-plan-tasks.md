# Sprint 012 — Sprint Plan Tasks

Created: Claude 2026-09-11. Coding follows the order below; Pablo's commit of [01](01-sprint-plan.md), [02](02-decisions.md)
and this document is the approval. Rules in [05](05-task-rules.md).

## Fixed decisions

- Authorization is the claim `admin: true` ([02](02-decisions.md)); the tool from Sprint 011 grants it.
- Three GET routes under `/v1/admin/analyses`; no POST exists. The agent routes are untouched.
- `analysis-contracts.js`, the runner, both stores' write paths and every `vista-*` module are untouched.

## Ordered tasks — server half

1. **Admin API error table.** `server/src/admin-api-error.js`. Codes: `unauthorized`, `forbidden`,
   `not_found`, `method_not_allowed`, `cursor_invalid`, `filter_invalid`, `analysis_not_found`,
   `storage_unavailable`, `index_unavailable`, `unexpected_server_error`.
2. **Diagnostics — access events.** `server/src/agent-diagnostics.js`. Event `access.completed`; ids
   `actorKey`, `targetOwnerKey`; operation choices; the `/v1/admin` route templates. Parity test extended.
3. **Cross-owner reader.** New `server/src/admin-analysis-reader.js`. `list({ owner, status, from, to,
   cursor, limit })` → `{ analyses, nextCursor }`; `read({ ownerKey, analysisId })`. Cursor encode/decode
   are pure and tested; Firestore is a double in tests; `FAILED_PRECONDITION` maps to `index_unavailable`.
4. **Owner identity resolver.** New `server/src/admin-owner-identity.js`. `labelFor(ownerKey)` per
   Decision 3, with a bounded `listUsers` walk and a sixty-second cache; Auth is a double in tests.
5. **Admin API handler.** New `server/src/admin-api-handler.js`. Route, gate on the claim, call the reader
   and resolver, serialize as the agent handler does, emit the access event, answer in the admin error shape.
6. **Composition and routing.** `server/src/firebase-admin-handler.js` (new), `firebase-services.js`
   (`createFirebaseAdminServices`), `firebase-api-router.js` (`/v1/admin` namespace), `firebase.js` (wire).
7. **Hosting rewrite and indexes.** `firebase.json` (`/v1/admin/**` rewrite, `firestore.indexes` entry),
   new `firestore.indexes.json`; the hosting test pins both.
8. **E2E step 08.** `e2e/server/step-08-admin-all-runs.mjs`, one line in `run.zsh`. Two agent owners upload;
   an admin granted with the tool lists, filters, pages, reads detail and source; agent-only and reviewer
   tokens get 403; no token 401; invalid cursor 400; POST 405; revoke → 401.

## Ordered tasks — page half

9. **Page script.** `dashboard/scripts/allruns.js`. Sign-in (reusing the agent page's paths), the not-
   authorized state, filters, cursor paging, row and attempt rendering, source image with object-URL release.
10. **Page markup and stylesheet.** `dashboard/allruns.html`, `dashboard/styles/allruns.css`.
11. **Admin link on the agent page.** `dashboard/scripts/agent.js`, `dashboard/agent.html`: a header link
    shown only when the token's claims carry `admin: true`. Hiding the link is convenience, not security.
12. **Guides and report.** `docs/11-operational-reality/operational-08-admin-access-administration.md`;
    `docs/09-build-and-test/sprint-012-delivered-scope.md`.

## Sequencing

1 → 2 → 5 (the codes exist and are allowed before they are thrown). 3 and 4 before 5. 5 before 6; 6 before 7
and 8. 9 → 10 → 11. 12 last, with real counts.
