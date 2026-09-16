# Proposal — Organize server source into modules

Status: proposed for review; sprint unassigned.
Requested by Pablo on 2026-09-16; target confirmed as `server/src`.

## Purpose

Replace a flat list of 90 JavaScript files with navigable responsibility-based
folders, each with a README explaining its purpose and how to read its code.

## Proposed organization

Keep `server/src/firebase.js` and `server/src/start.js` as stable entrypoints.
Group other files under `agent/`, `recognition/`, `inspections/`, `vista/`,
`admin/`, `platform/`, `media/`, `shared/` and `legacy/`.
Use focused subfolders for larger groups; keep current JavaScript basenames.
See the [complete file map](../../guides/server-side-analysis/source-module-map.md).
These are source-navigation modules, not new services or deployment units.

## Scope and safeguards

- Move files and adjust imports, resource paths, tests, scripts and guide links.
- Add a README to each module/submodule with entrypoints and code/test links.
- Preserve HTTP contracts, function exports, regions, claims and persisted data.
- Preserve prompts, catalog selection, attempt fencing and cancellation behavior.
- Keep the original HTTP path active; `legacy/` does not authorize its removal.
- Do not split large files, redesign dependencies or upgrade packages in this move.
- Keep catalogs, schemas and environment files in their existing locations.

## Acceptance to include in the future sprint

- Every source file has exactly one documented destination and responsibility.
- All local imports and resource paths resolve; tests and scripts use valid paths.
- Existing deterministic tests and emulator flows pass against a recorded baseline.
- Function entrypoints and exported names remain unchanged; no provider spend.
- Every module README explains purpose, boundaries, reading order and tests.
- Recognition guides retain clickable source links with visible repository paths.

## Boundaries and next gate

This proposal does not extend Sprint 014 or authorize executable changes.
Confirm the approved integration baseline and dedicated refactor sprint branch.
Create that branch before drafting a numbered Sprint Plan.
Pablo commits the Plan, then separately the component-scoped Tasks, before coding.
Tasks must name approved components; folder names do not redefine ownership.
Cross-component importer updates need ordered tasks and an explicit migration strategy.
Deployment, live paid tests and release require their own authorization.
