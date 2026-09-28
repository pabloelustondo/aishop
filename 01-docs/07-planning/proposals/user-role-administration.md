# Proposal — AI Shop user role administration

Status: proposed scope for review; not assigned to a sprint.
Requested by Pablo on 2026-09-15 during guided API testing.

## Purpose

Let an authorized administrator manage AI Shop access from a web page,
without running a local script or granting Google Cloud IAM privileges.

## Proposed scope

- Find existing Firebase users by email and show their current application roles.
- Grant or revoke Agent and Admin independently, with explicit confirmation.
- Explain the privileges each role grants before saving a change.
- Show the saved result and explain when a new sign-in/token is required.
- Retain the existing script as a controlled recovery mechanism.

## Required safeguards

- Verify administrative authority server-side on every role-management request.
- Decide whether role administration needs a separate permission from All runs.
- Never trust a browser-provided role or permit self-service privilege escalation.
- Preserve unrelated claims; change only the explicitly selected roles.
- Prevent accidental loss of the last administrator and self-lockout.
- Record actor, target, previous/new roles, time and outcome in an audit trail.
- Never record passwords, tokens or other authentication secrets.
- Define revocation behavior for already-issued tokens and test it explicitly.
- Handle concurrent changes without silently overwriting another administrator.

## Acceptance to include in the future sprint

Prove unauthorized users cannot list users or change roles through direct API calls.
Prove authorized changes persist and affect access with the documented token lifecycle.
Prove unrelated claims survive and lockout/concurrency protections work.
Verify clear confirmation, failure and success states in the hosted page.

## Boundaries and next gate

Account creation, deletion, password administration and GCP IAM are out of scope.
This proposal does not extend Sprint 014 or interrupt current API validation.
Create the dedicated branch before drafting a numbered sprint plan.
Implementation requires separately committed Sprint Plan and Tasks documents.
