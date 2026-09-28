# Sprint 005 Correction 03 — Stale Reservation Observability Exception

HumanReviewerInitials: PME

## Conflict

The vendored persistence contract requires a bounded diagnostic for stale
`receiving` reservations. Sprint 005 safely emits a redacted bounded event when
such a reservation is resumed, but it does not classify age or proactively find
an abandoned reservation. No approved staleness threshold, scan schedule,
retention policy, monitoring destination, or authority for another function
exists. Inventing those choices would exceed the approved endpoint scope.

## Proposed bounded exception

- Accept resume-only `vista.package.receiving_resumed` diagnostics for endpoint
  v1 as known governance debt; the event contains only schema version, event
  name, and state.
- Do not call the event stale and do not claim abandoned-reservation detection.
- Keep truthful `receiving` state, immutable objects, same-manifest recovery,
  conflict handling, and retry semantics unchanged.
- Record proactive stale detection as a future governed increment requiring an
  explicit threshold, clock, query boundary, schedule, privacy policy, tests,
  operational owner, and deployment/IAM approval.

## Consequences

An abandoned `receiving` record is not surfaced until an identical request
resumes it or an operator discovers it. No evidence is deleted and no false
receipt is created. This exception changes observability completeness only; it
does not weaken persistence integrity or authorize deployment.

## Approval effect

PME initials plus staging of this exact document approve the explicit exception
to persistence-contract line 110 and permit Sprint 005 disposition as
**ACCEPT WITH CONDITIONS**. Approval does not authorize code changes, a timer,
scheduled function, new endpoint, retention cleanup, IAM mutation, deployment,
executable staging, commit, push, merge, or release.
