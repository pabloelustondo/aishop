# Environment Designation

HumanReviewerInitials: PME

HumanReviewDate: 2026-08-13

## Declared environments

| Environment | Infrastructure identity | Purpose | Deployment authority |
|---|---|---|---|
| Local | Firebase emulators, project `demo-aishop-e2e` | Automated end-to-end gate; ephemeral; unreachable from any real project | None required |
| Test | Firebase project `aishop-99d36` | All current development, deployment, qualification, and manual testing | Pablo, per deployment |
| Production | Does not exist | — | — |

## Decision

Firebase project `aishop-99d36` is the **test environment**. No production
environment exists. Everything currently built, deployed, and exercised —
the `api` function, the VISTA package-ingest endpoint, Firestore records,
Storage evidence, and all user accounts — is test material.

Pablo Elustondo decided this on 2026-08-13, instructing that the current
server is the test environment and "all we do for now is test environment."
Claude transcribed the decision and corrected the two reference lines that
called the same URL production; this creates no standing delegation.

## What this settles

- `https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api` is the
  test base URL; retained smoke-test data needs no cleanup.
- Load and failure qualification, including deliberate exhaustion of the
  256 MiB function memory, is permitted and expected here before real client
  testing depends on the result.
- Agent access may be generous here because it holds no production data.

## Required environment decisions answered

Records decisions 2, 4 (partially), and 7 of the VISTA handoff bundle's
`07-ENVIRONMENT-DECISIONS-REQUIRED.md`: the named test project, the initial
test approach using a dedicated account, and no deletion or retention
automation in endpoint v1.

## Limits

- A naming and governance decision, not a data-protection posture. Real store
  photographs are acceptable here only while they are Pablo's own.
- A production environment requires a separate Firebase project with its own
  configuration and authority. It must never be created by renaming this one.
- This decision authorizes no deployment, IAM change, retention automation,
  commit, push, merge, or release.
