# VISTA Server Endpoint Agent Handoff v0.1

**Bundle version:** 0.1  
**Endpoint contract version:** 0.2

## Objective

Implement exactly one authenticated server endpoint:

```http
POST /v1/vista/inspection-packages
```

The endpoint receives one client-declared VISTA inspection transport package
as multipart data:

- one manifest JSON part;
- one client-claimed authoritative VISTA audit JSON artifact; and
- every JPEG artifact declared by the manifest.

It validates the complete **declared transport set**, stores it privately and
immutably, and returns a receipt bound to the VISTA run ID, manifest SHA-256,
and complete accepted transport artifact-hash set. Endpoint v1 does not prove
that a buggy or hostile client declared every image in its local C07 run, nor
that the evidence originated on a genuine VISTA device.

## Authority and scope

Read in this order:

1. `01-IMPLEMENTATION-BRIEF.md` — bounded work order and stop conditions.
2. `02-ENDPOINT-SPECIFICATION.md` — normative endpoint semantics.
3. `api/openapi.yaml` — machine-readable HTTP contract.
4. `05-C07-EXPORT-AND-IMAGE-CONTRACT.md` — exact audit-chain, sealed-manifest,
   and current image-media facts.
5. `06-PERSISTENCE-CONCURRENCY-AND-RECOVERY.md` — normative idempotency and
   crash-recovery algorithm.
6. `schemas/` — machine-readable payload schemas.
7. `fixtures/` — shared contract examples and negative cases.
8. `03-VISTA-SERVER-INVARIANTS.md` — VISTA behavior the server must preserve.
9. `04-VALIDATION-CHECKLIST.md` — required RED, GREEN, integration, and handoff
   evidence.
10. `07-ENVIRONMENT-DECISIONS-REQUIRED.md` — values that must be confirmed
    from the actual server/deployment before release.
11. `SOURCE-MAP.md` — relationship to source VISTA and AI-Shop documents.

The exact endpoint specification and Pablo's current instructions outrank the
AI-Shop reference. AI-Shop is implementation evidence and a reusable pattern,
not permission to copy identifiers, secrets, collection names, or product
semantics blindly.

## What is deliberately not included in the endpoint sprint

- iPhone implementation;
- a second upload endpoint;
- resumable per-file sessions;
- server OpenAI analysis;
- assessment retrieval;
- reviewer UI;
- evidence deletion or retention automation;
- changes to the existing AI-Shop `/inspections` endpoint; or
- deployment to production.

These may be proposed later. They are not necessary to prove receipt of the
complete client-declared v1 transport set.

## Inputs the receiving agent must confirm before coding

The bundle cannot discover server-repository facts. Confirm and record:

1. exact server repository, branch, commit, status, and local instruction files;
2. existing route framework and multipart/body parsing behavior;
3. existing Firebase Admin/authentication adapter;
4. development Firebase project, region, Storage bucket, and Firestore database;
5. configured platform request-size ceiling;
6. approved per-artifact, pixel-dimension, artifact-count, and total-package limits below that
   platform ceiling;
7. whether deployment is authorized or implementation/test only; and
8. the human reviewer for contract or security exceptions.

If any existing server source contradicts the endpoint specification, stop and
report both sources. Do not resolve the conflict by silently changing the
contract.

## Expected delivery

The server handoff must identify:

- files changed and components/responsibilities introduced;
- exact RED and GREEN test commands/results;
- development environment and function revision if deployment was authorized;
- fixture IDs, run ID, manifest hash, artifact hashes, and receipt ID used;
- authentication, ownership, immutability, idempotency, and privacy evidence;
- any deviation or unresolved limit;
- independent review result; and
- recommendation: accept, accept with conditions, or reject.

## Integrity

`SHA256SUMS.txt` covers every file in this handoff except itself. Verify it
before relying on copied fixtures or schemas.

The dependency-free fixture check requires Node.js 18 or newer:

```bash
node scripts/verify-handoff.mjs
```

`scripts/generate-valid-fixture.mjs` deterministically rebuilds the synthetic
C07-consistent audit, manifest, receipt, and metadata around the included JPEG.
Regeneration changes dependent hashes and must be followed by checksum
regeneration and review.
