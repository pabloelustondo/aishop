# Sprint 008 — Sprint Plan Tasks

Created: Claude 2026-09-06. Coding begins only after Pablo commits
this exact document.

## Governing artifacts

- [Sprint Plan](01-sprint-plan.md) and [Boundaries](02-boundaries.md)
- [Component architecture](../../../06-solution-design-and-architecture/components/component-architecture.md)

## Fixed decisions

- Route base `/v1/agent/analyses`. Firestore
  `agentAnalyses/{ownerKey}/analyses/{analysisId}`. Storage
  `agent/analyses/{ownerKey}/{analysisId}/source`.
- `ownerKey` is the lowercase SHA-256 of the verified Firebase uid,
  derived inside the agent modules; no `vista-*` module is imported.
- One still JPEG per upload, at most 5 MiB, at most 4,096 px per axis.
  PNG and HEIC are rejected with a stable code, not silently converted.
- `analysisId` is server-generated. Re-uploading the same bytes creates
  a separate analysis; a person may legitimately ask twice.
- Analysis uses `areaScan`. Catalog matching is out of scope.
- Statuses: `uploaded`, `analyzing`, `analyzed`, `failed`.

## Ordered implementation tasks

1. **Agent Evidence Store** — create-only source-object write and read
   under the owner-scoped prefix; no overwrite, private objects.
2. **Agent Analysis Store** — record create, owner-scoped list and read,
   and the four status transitions; no raw bytes in Firestore.
3. **Agent Upload Request** — bounded multipart read, exactly one file
   part, JPEG structure and dimension checks, content hash, stable
   errors in a declared precedence.
4. **Agent Analysis Runner** — stored bytes through the existing OpenAI
   adapter in `areaScan`, report stored on the record, typed provider
   and timeout failures that leave the record `failed`, never silent.
5. **Agent API Handler** — token verification, dispatch of the four
   operations, error mapping, `Cache-Control: no-store` on every
   response, and owner isolation on every read.
6. **Firebase API Router** — route `/v1/agent` to the new handler and
   prove the VISTA, `/inspections`, and legacy paths are unchanged.
7. **Firebase composition** — build the handler with real services and
   the OpenAI secret; hosting rewrite for the new path.
8. **Agent page** — `dashboard/agent.html` and its script: upload field,
   submit, and the list of submissions with status and result.
9. **End-to-end gate** — a `step-04` that uploads, runs, and reads back
   against the emulators, wired into `./e2e/server/run.zsh`.

Rules and validation: [04-task-rules.md](04-task-rules.md).
