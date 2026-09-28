# Sprint 012 — Task Rules and Validation

Companion to [04-sprint-plan-tasks.md](04-sprint-plan-tasks.md). Sprint 011's rules apply unchanged; these add to them.

## Task rules

- Every All-runs route checks the claim before touching Firestore, Storage or Auth. A test proves it for
  each route by counting store calls after a 403.
- Logs never carry an email, display name, uid, filter value, cursor or file name. `actorKey` and
  `targetOwnerKey` are hashes; that is all an operator sees.
- The reader is read-only by construction: it holds no reference to `create`, `transition` or
  `storeSource`, and the handler composes no runner.
- A response never invents a field: a legacy record without `width`, `mode` or `report` answers `null`.
- The owner resolver answers a label or one of two words, "anonymous" and "unresolved"; never a uid.
- Documents in this folder, operational-08 and the delivered-scope report: at or under 50 physical lines.

## What stays unauthorized

Deployment; granting the admin role to any account; deleting or exporting records; writes from the page;
changes to the agent routes, the runner, the stores' write paths, or any `vista-*` module.

## Validation after task 8 (server) and task 11 (page)

- `npm --prefix server test` — full suite, real counts, `sharp` failures listed if not on macOS.
- `./e2e/server/run.zsh` — the whole suite including steps 07 and 08.
- On TEST after deployment: the composite indexes exist (Console → Firestore → Indexes), the admin account
  lists both owners, an agent-only account receives 403 on `/v1/admin/analyses`.
- On the page: sign in as admin, see two owners, filter by each, page with limit 1, open an attempt
  history, load an image; sign in as agent-only, see the not-authorized state; My runs unchanged.

## Deployment order, when authorized

1. `firebase deploy --only firestore:indexes` and wait for the indexes to build (minutes).
2. Grant `--role admin` to Pablo's account with the tool; confirm with `show`.
3. `firebase deploy --only functions,hosting`. 4. Sign in again; open `/allruns.html`.
5. Logs Explorer: one `access.completed` per admin request, with `actorKey` and no email.
