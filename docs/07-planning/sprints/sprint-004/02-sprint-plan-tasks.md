# Sprint 004 — Sprint Plan Tasks

HumanReviewerInitials:PME

## Purpose

Translate the approved Sprint Plan into ordered, component-scoped implementation tasks.

## Governing artifacts

- [Sprint Plan](01-sprint-plan.md)
- [Customer and reviewer access architecture](../../../06-solution-design-and-architecture/architecture-03-customer-and-reviewer-access.md)
- [Component architecture](../../../06-solution-design-and-architecture/components/component-architecture.md)

## Ordered implementation tasks

1. **Inspection API** — Add a verified-customer identity check, mirroring `reviewer-auth.js`, that accepts any valid Firebase ID token and returns an `ownerId`; no custom claim required, with tests for missing, malformed, and valid tokens.
2. **Inspection Record Store** — Accept and persist an `ownerId` on `createInitial` and `createFailure` without weakening existing immutability, with a regression test that initial findings still cannot be mutated.
3. **Inspection API** — On `POST /inspections`, replace the static shared-token check with the verified-customer identity check and pass the resulting `ownerId` into submission, with tests for authorized, unauthenticated, and invalid-token requests.
4. **Inspection API** — On `GET /inspections/:id`, accept a verified customer identity as an alternative to a reviewer identity; return a record only when it belongs to that `ownerId`, and deny it otherwise, with a test proving one customer cannot read another's scan ID.
5. **Inspection API** — Remove the static shared-client-token path and its configuration secret from the inspection endpoints once tasks 1–4 pass, with a regression test proving a request bearing the old token is rejected.
6. **Mobile Capture Client** — Add the Firebase Auth and Google Sign-In SDKs and configuration to the Xcode project, without wiring any screen yet.
7. **Mobile Capture Client** — Build the sign-up/sign-in screen (Google Sign-In and Email/Password registration) that gates the camera, with signed-out, registering, signed-in, and failure states.
8. **Mobile Capture Client** — Attach the signed-in customer's Firebase ID token as the request's bearer credential in `InspectionAPIClient`, replacing the static client token.

## Task rules

- Execute tasks in order unless an approved revision changes the sequence.
- Each task may modify only its named component and its component-owned tests.
- A discovered cross-component change becomes separate ordered tasks before implementation.
- Completing one task does not authorize commit, deployment, release, or the next sprint.

## Validation

After the implementation tasks, validate end to end: automated tests pass, a new customer can register with each provider and immediately capture and receive a report, a locked-out Email/Password customer recovers through the reset-email flow, the retired static token no longer authorizes requests, and existing reviewer sign-in and review actions are unaffected. Any required fix becomes a new component-scoped task and requires renewed approval before coding.

Coding begins only after this exact document is human-approved and fully staged.
