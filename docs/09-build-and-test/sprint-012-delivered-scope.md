# Sprint 012 — Implementation and Local Validation

Date: 2026-09-11. Branch: `main`. Plan, decisions, tasks and rules drafted and implemented in the same session
on Pablo's verbal authorization of 2026-09-11; his commit of the sprint folder is the approval. Uncommitted,
not deployed. Same sandbox limits as Sprint 011: unit suites ran, the emulator suite did not.

## Delivered behavior (server half, tasks 1–8)

- `admin-api-error.js`: ten codes, own messages; diagnostics gain `access.completed`, `actorKey`,
  `targetOwnerKey`, `operation`, `accessErrorCode` and the `/v1/admin` route templates (parity test).
- `admin-analysis-reader.js`: collection-group listing newest first with a document-path tie-breaker, opaque
  strict cursor, owner/status/day-range filters, page 1–50, `FAILED_PRECONDITION` → `index_unavailable`;
  read-only by construction. Store exports `summarizeAnalysis` and `ANALYSIS_COLLECTIONS`; no write path changed.
- `admin-owner-identity.js`: bounded `listUsers` walk hashed to owner keys, sixty-second cache, one walk
  under concurrency, "anonymous"/"unresolved" words, a directory failure never fails a page.
- `admin-api-handler.js`: three GET routes, claim checked before any store, labels on every row, one access
  event per request by reference; `serializeRecord` exported from the agent handler for identical timestamps.
- Composition `firebase-admin-handler.js` + `createFirebaseAdminServices`; router `/v1/admin` namespace;
  `firebase.js` wired; `firebase.json` rewrite `/v1/admin/analyses{,/**}` and `firestore.indexes`;
  `firestore.indexes.json` with the three composite and one field-override collection-group indexes (pinned).
- E2E step 08: two owners, an admin granted `--role admin` with the tool, list/labels/filters/paging by one,
  detail, source bytes by hash, 401/403/400/405, records unchanged, access log by reference, revocation.

## Delivered behavior (page half, tasks 9–11)

- `allruns.html/js/css`: sign-in states shared with My runs, filter bar (owner key, *Current status*, created
  from/to, per page), Previous/Next with a cursor trail, rows as expandable `<details>` with image, facings
  and every attempt; images loaded on open and released on re-render; unavailable image said explicitly.
- My runs shows an "All runs" link only when the token carries `admin: true`.

## Verification

- `npm --prefix server test`: 317 tests, 290 pass; the same 20 pre-existing `sharp` failures, none new.
  New suites: reader 7, identity 3, admin handler 9, router +2, hosting +2, page 4 — all green.
- `git diff --check` clean; all sprint documents and operational-08 ≤ 50 lines.

## Not verified here — Pablo's Mac before staging and before deployment

- `./e2e/server/run.zsh` including step 08.
- Page by hand: admin sees two owners, filters, pages with limit 1, opens attempts, loads an image; agent-only
  account sees the not-authorized state; My runs unchanged for a non-admin.
- TEST: `firebase deploy --only firestore:indexes` first and wait for *Enabled*; a full `firebase deploy` now
  also targets Firestore indexes because of the new `firestore` key — confirm the CLI accepts it without rules.
