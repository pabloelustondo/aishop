# VISTA Package Endpoint Validation Checklist

## A. Preflight

- [ ] Read repository-local agent instructions completely.
- [ ] Record Git root, branch, commit, remote, and dirty/untracked state.
- [ ] Identify the existing AI-Shop route, Firebase token verifier, Storage
      adapter, Firestore adapter, error mapper, logging, and test framework.
- [ ] Confirm development Firebase project, region, bucket, database, and
      deployment authority.
- [ ] Determine the actual HTTP request limit and middleware buffering behavior.
- [ ] Set explicit package limits below the actual platform limit.
- [ ] Verify no credential or secret is present in this handoff bundle.

## B. Contract validation

- [ ] Only `POST /v1/vista/inspection-packages` is added.
- [ ] `Authorization`, `Idempotency-Key`, manifest-hash header, and multipart
      content type are required.
- [ ] Manifest schema rejects missing and extra keys.
- [ ] Manifest SHA-256 is computed from exact received manifest-part bytes.
- [ ] Run ID in header/idempotency key and manifest agree after UUID parsing and
      lowercase canonical normalization.
- [ ] `completedAt` is a valid UTC timestamp ending in `Z`.
- [ ] `terminalChainHash` and `sealedManifest` are 64 lowercase hex values.
- [ ] At least one `audit/events` artifact and one accepted image exist.
- [ ] Multipart unique hash set exactly matches the manifest unique hash set.
- [ ] Duplicate logical references to identical content remain representable.
- [ ] Logical artifact IDs are unique; repeated SHA descriptors agree on media
      type and byte count.
- [ ] Every part's byte count and SHA-256 match.
- [ ] Audit bytes are syntactically valid JSON with a top-level array.
- [ ] Every image contains exactly one decodable JPEG within configured byte,
      dimension, and pixel limits; HEIC and concatenated images are refused.
- [ ] Each artifact filename is exactly `<declared-sha256>.json` or
      `<declared-sha256>.jpg`, is used only as an untrusted binding claim, and
      is never used raw as an object path. Audit `relativeLocation` is ignored.
- [ ] Absolute paths and ownership claims are rejected/absent.

## C. Authentication and ownership tests

- [ ] No bearer token -> `401 unauthorized`.
- [ ] Malformed/expired/unverifiable token -> `401 unauthorized`.
- [ ] Verified token derives trusted `ownerId`.
- [ ] Client `ownerId` or email field is rejected as an extra manifest key.
- [ ] Same `runId` may exist independently for different trusted owners without
      cross-owner visibility.
- [ ] Owner A cannot receive or mutate Owner B's receipt/evidence.

## D. Negative integrity tests

- [ ] Manifest hash header mismatch.
- [ ] Missing/invalid/mismatched idempotency key.
- [ ] Missing/invalid/mismatched manifest-hash header.
- [ ] Malformed multipart boundary and duplicate manifest part.
- [ ] Missing/path-bearing/non-hash artifact filename.
- [ ] Invalid UUID/run kind/date/version field.
- [ ] Invalid terminal-chain hash.
- [ ] Missing audit artifact.
- [ ] Missing image artifact.
- [ ] Unexpected artifact.
- [ ] Duplicate uploaded artifact body.
- [ ] Repeated logical hash with inconsistent byte count/media type.
- [ ] Wrong declared byte count.
- [ ] Wrong declared SHA-256.
- [ ] PNG/HEIC/text mislabeled as JPEG.
- [ ] JPEG truncated before EOI.
- [ ] Matching hash and length but structurally invalid/concatenated JPEG.
- [ ] Unsupported artifact kind/media type.
- [ ] Artifact-count limit exceeded.
- [ ] Per-artifact limit exceeded.
- [ ] Total-package/request limit exceeded.

## E. Persistence and idempotency tests

- [ ] First valid package returns `201` and exact receipt.
- [ ] Manifest and evidence objects are private.
- [ ] Storage writes cannot overwrite existing bytes.
- [ ] Firestore/database package record uses immutable create or transaction
      semantics.
- [ ] Owner/run reservation records manifest hash and one receipt ID before
      object writes.
- [ ] Same owner/run/manifest returns `200` and same logical receipt.
- [ ] Concurrent identical requests converge on one receipt (`201` for the
      finalizing request, `200` for the one observing receipt).
- [ ] Same owner/run/different manifest returns `409 run_manifest_conflict`.
- [ ] Concurrent conflicting manifests create one reservation and one conflict.
- [ ] Storage failure returns no receipt and preserves truthful partial state.
- [ ] Database-finalization failure leaves `receiving`; identical retry verifies
      existing objects and completes without a second receipt.
- [ ] Retry after a lost successful response creates no duplicate package.
- [ ] Artifact hash list in receipt is complete, unique, and lexical.

## F. Security and privacy tests

- [ ] HTTPS/deployment policy matches the existing API.
- [ ] Firebase Admin and OpenAI credentials remain server-side.
- [ ] No token/Authorization header in logs.
- [ ] No image or audit content/Base64 in logs.
- [ ] Safe errors contain no stack, provider response, internal path, or private
      object URL.
- [ ] Evidence metadata and response use no public cache semantics.
- [ ] Every success and error response uses `application/json` and
      `Cache-Control: no-store`.
- [ ] Client filenames, UID text, and device-relative paths cannot traverse or
      control Storage paths.
- [ ] Tests do not claim that Firebase authentication or hashes prove genuine
      app/device origin.
- [ ] Existing reviewer/admin claims do not accidentally broaden submitter
      access.

## G. Regression

- [ ] Existing `/inspections` exact-field contract remains unchanged.
- [ ] Existing one-image AI-Shop happy path passes.
- [ ] Existing AI-Shop auth, ownership, evidence, provider-failure, and review
      tests pass.
- [ ] No deployment configuration or secret unrelated to VISTA changed.

## H. Development integration evidence

When deployment is authorized:

- [ ] Health endpoint identifies the intended development deployment.
- [ ] Protected VISTA endpoint without token returns `401`.
- [ ] Valid fixture upload returns `201`.
- [ ] Stored manifest bytes match fixture SHA-256.
- [ ] Stored audit bytes match fixture SHA-256.
- [ ] Stored JPEG bytes match fixture SHA-256.
- [ ] Identical retry returns `200` and the same receipt ID.
- [ ] Conflict fixture returns `409` and leaves original receipt unchanged.
- [ ] Test account B cannot collide with or observe account A's package.
- [ ] Function revision, project, region, bucket, database, test-account IDs,
      fixture IDs, receipt, and timestamps are recorded without credentials.

## I. Required handoff

- [ ] Scope/non-goals and use-case traceability.
- [ ] Branch, exact commit, worktree, and environment.
- [ ] Components/responsibilities/contracts/files changed.
- [ ] First failing tests and expected failure reasons.
- [ ] Exact test commands and pass/fail/skip counts.
- [ ] Fixture hashes and receipt evidence.
- [ ] Security/privacy/log inspection evidence.
- [ ] Existing AI-Shop regression result.
- [ ] Known limits, partial-write truth, risks, and technical debt.
- [ ] Independent architecture/code review result.
- [ ] Recommendation and exact next action.

## Example request shape

Artifact filenames are mandatory untrusted binding claims. They are strict
lowercase SHA-256 plus `.json`/`.jpg`; the server verifies the computed hash and
never uses the raw filename as a Storage path.

```bash
curl --fail-with-body \
  -X POST "$VISTA_API_BASE/v1/vista/inspection-packages" \
  -H "Authorization: Bearer $VISTA_ID_TOKEN" \
  -H "Idempotency-Key: 2C11D24C-86DA-4AE9-9BE4-D67308E27389" \
  -H "X-Vista-Manifest-SHA256: $VISTA_MANIFEST_SHA256" \
  -F "manifest=@fixtures/valid/manifest.json;type=application/json;filename=manifest.json" \
  -F "artifact=@fixtures/valid/audit-transport.json;type=application/json;filename=881cbdace3db209aab4f8cbb5d183ec8f6a71662ff6f5d7e5c22c7fecca858b3.json" \
  -F "artifact=@fixtures/valid/accepted-detail.jpg;type=image/jpeg;filename=7f2ef803eb18c972385ea5f830fb59e95f40ae0be34de1dceb275b7da787f607.jpg"
```

Before using the fixture:

```bash
node scripts/verify-handoff.mjs
export VISTA_MANIFEST_SHA256=3e338f7284385a87c96d2f0e97eeabf9c5dc1d3b932892a58e9101a51064b439
```

Do not place literal credentials into scripts, fixtures, screenshots, logs, or
handoff documents.
