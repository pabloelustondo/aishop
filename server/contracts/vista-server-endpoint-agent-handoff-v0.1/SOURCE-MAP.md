# Source Map and Authority

## Normative for this server increment

1. `01-IMPLEMENTATION-BRIEF.md`
2. `02-ENDPOINT-SPECIFICATION.md`
3. `05-C07-EXPORT-AND-IMAGE-CONTRACT.md`
4. `06-PERSISTENCE-CONCURRENCY-AND-RECOVERY.md`
5. `api/openapi.yaml`
6. `schemas/*.schema.json`
7. Pablo's current written decisions and corrections

If these disagree, the prose endpoint specification controls until Pablo
approves a correction. The receiving agent must report the mismatch and update
all representations together after approval.

## VISTA constraints included for context

- `reference/vista/AGENTS.md`
- `reference/vista/vista-iphone-architecture-offline-edge-server-confirmation-and-analytics.md`
- `reference/vista/vista-observability-audit-trail-and-logging-specification.md`
- `reference/vista/vista-testability-dependency-injection-and-verification-specification.md`
- `reference/vista/05-c07-audit-evidence-durable-storage-and-reports.md`

These establish offline-first behavior, additive server truth, audit meaning,
testability, and review discipline. They do not grant server deployment
authority.

## AI-Shop implementation references

All documents under:

```text
reference/aishop-ios-server-integration-guide/
```

They describe the implemented one-image Firebase/Auth/Storage/Firestore/OpenAI
path. Reuse its authentication, ownership, validation, immutable persistence,
safe-error, and secret-handling patterns where the current server code confirms
them.

The imported AI-Shop README retains four links to its originating repository's
`ios/` and `server/` source trees. Those targets are deliberately **not** in
this ZIP and the links will not resolve here. Treat every imported document as
a contextual snapshot. The receiving agent must inspect the actual server
repository before claiming that a named adapter, path, limit, or behavior still
exists.

Do not copy:

- AI-Shop bundle/Firebase identifiers as VISTA identity;
- secrets or plist files;
- the retired static token;
- the exact one-image body as the VISTA package body;
- synchronous AI completion as package receipt; or
- collection/Storage namespaces without an explicit VISTA boundary.

## Repository source locations before packaging

- Endpoint specification:
  `docs/11_code_analysis_and_plans/vista-minimal-server-upload-endpoint-specification.md`
- AI-Shop reference:
  `docs/04_architecture_and_planning/reference/aishop-ios-server-integration-guide/`
- VISTA operating contract: `AGENTS.md`
- VISTA iPhone/server architecture:
  `docs/04_architecture_and_planning/vista-iphone-architecture-offline-edge-server-confirmation-and-analytics.md`
- VISTA observability specification:
  `docs/03_engineering_governance/vista-observability-audit-trail-and-logging-specification.md`
- VISTA testability specification:
  `docs/03_engineering_governance/vista-testability-dependency-injection-and-verification-specification.md`
