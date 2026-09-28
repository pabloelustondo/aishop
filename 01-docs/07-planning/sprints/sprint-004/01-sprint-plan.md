# Sprint 004 — Customer Self-Registration

HumanReviewerInitials:PME

## Goal

Let AI Shop customers create their own account in the iPhone app with Google Sign-In or Email/Password, and see only their own inspections. Reviewer accounts are unchanged: an administrator continues to create them directly in Firebase.

## Governing requirements

Follow the approved [intent](../../../02-intent/intent.md) and [customer and reviewer access architecture](../../../06-solution-design-and-architecture/architecture-03-customer-and-reviewer-access.md).

## In scope

- Add Firebase Authentication and Google Sign-In to the iPhone app.
- A sign-up/sign-in screen gates the camera and supports Google Sign-In and Email/Password registration.
- The server verifies a Firebase ID token on every inspection request instead of the static shared client token.
- Every new submission records an immutable `ownerId` from the verified token.
- Every read is scoped to `inspection.ownerId == authenticated.uid`.
- Firebase's standard reset-email flow for a locked-out Email/Password customer.
- Clear signed-out, registering, signed-in, and authentication-failure states in the app.
- Automated tests for registration, sign-in, ownership enforcement, and denial of a stale shared client token.

## Security boundaries

- `ownerId` is assigned once at submission and never mutated afterward.
- A customer cannot read another customer's inspection by any means, including guessing a scan ID.
- No password, token, or secret is logged or stored by AI Shop.
- The reviewer path — Google sign-in plus the `reviewer` claim — is unchanged by this sprint.

## Delivery order

1. Server: verify Firebase ID tokens on the inspection API, add `ownerId` capture and read enforcement, retire the static client-token check.
2. iOS: integrate Firebase Auth and Google Sign-In, build the sign-up/sign-in screen, attach the signed-in user's ID token to requests.
3. Run automated, deployment, and physical-iPhone validation for both providers and the ownership boundary.

## Acceptance and evidence

- A new customer registers with Email/Password and immediately captures and receives a report.
- A new customer registers with Google and immediately captures and receives a report.
- A signed-in customer's request for another customer's scan ID is denied.
- A locked-out Email/Password customer recovers access through the reset-email flow.
- The retired static client token no longer authorizes requests.
- Existing reviewer sign-in and review actions are unaffected.
- Evidence includes automated results, an ownership-denial check, and physical-iPhone QA for both providers.

## Out of scope

Reviewer or dashboard changes, admin claim tooling, a private **My Inspections** browsing view, email verification at registration, customer deletion and retention policy, and migrating historical shared-token submissions to an owner remain outside Sprint 004.
