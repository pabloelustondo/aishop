# Sprint 005 Correction 02 — Firebase Operational Hardening

HumanReviewerInitials: PME

## Findings

- Missing VISTA startup limits prevent every route in shared `api` from starting.
- A non-file field can fail during parsing before required-header precedence.
- Token-verifier infrastructure failures currently become non-retryable `401`.

## Approved design if accepted

- Preserve fail-closed module startup; do not add defaults or a route-only
  fallback. Before any deployment, configure these exact non-secret values:
  `VISTA_MAX_MANIFEST_BYTES=262144`, `VISTA_MAX_AUDIT_BYTES=5242880`,
  `VISTA_MAX_JPEG_BYTES=5242880`, `VISTA_MAX_PACKAGE_BYTES=26214400`,
  `VISTA_MAX_JPEG_AXIS=4096`, `VISTA_MAX_JPEG_PIXELS=16777216`,
  `VISTA_MAX_ARTIFACTS=40`, `VISTA_MAX_ARTIFACT_PARTS=40`, and `VISTA_MAX_MULTIPART_PARTS=41`.
- Deployment preflight proves exact values; a missing or changed value blocks deployment.
- Parse bounded multipart framing first, retain only bounded field identity,
  then validate headers before semantic field and filename errors.
- Map known missing, malformed, expired, revoked, or invalid credentials to
  `401 unauthorized`. Map verifier infrastructure failures to
  `500 unexpected_server_error` with `retryable=true` and bounded safe logs.

## Ordered correction tasks

1. **Inspection API:** add startup/deployment-preflight tests and disclose the
   shared-function startup consequence in the implementation evidence.
2. **Inspection API:** correct combined-fault precedence without weakening
   byte, file, field, or total-part bounds.
3. **Inspection API:** classify VISTA authentication failures without exposing
   tokens, raw UIDs, provider messages, causes, or stack traces.

## Acceptance

- Exact configuration imports successfully; each missing or changed value
  fails before route creation, and `/inspections` regressions remain green.
- Malformed framing beats missing headers; otherwise required-header errors
  beat stray-field or filename errors; valid headers preserve stable codes.
- Invalid credentials return `401`; an injected verifier outage returns safe,
  retryable `500`; logging-redaction tests pass.
- Update the evidence report, run focused RED/GREEN tests and the full suite,
  and obtain independent review before human disposition.

## Limits and approval effect

This authorizes no deployment, IAM change, new endpoint, new error code, change
to `/inspections`, commit, push, merge, or release. PME initials plus staging of
this exact document authorize only the three correction tasks above.
