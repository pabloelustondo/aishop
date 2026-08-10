# Firebase Reviewer Administration

HumanReviewerInitials: PME

## Observed configuration — 2026-08-09

- Firebase project: `aishop-99d36`; billing plan: Blaze.
- Firebase Authentication with Identity Platform is enabled; this upgrade is irreversible.
- Email/Password and Google providers are enabled.
- End-user account creation and deletion are disabled.
- Email-enumeration protection remains enabled.
- Administrators can still create and delete users with Firebase Console or Admin SDK.
- The deployed dashboard currently displays only Google sign-in.
- The server accepts a verified Firebase token only when `reviewer === true`.

## Decisions

- The review dashboard is invitation-only; it has no public registration.
- Reviewers may use an administrator-created `@elustondo.ai` Email/Password account.
- A Firebase account and reviewer authorization are separate controls.
- Creating a user does not grant access; the administrator must also grant the reviewer claim.
- Google sign-in remains available for existing invited reviewers.
- Customer self-registration and private customer inspection history are separate future work.

## Recipe: invite a reviewer

1. Open [Firebase Authentication Users](https://console.firebase.google.com/project/aishop-99d36/authentication/users).
2. Select **Add user**, enter the approved `@elustondo.ai` address, and set a temporary password.
3. Confirm the address and intended reviewer with the administrator; never record the password in Git or logs.
4. Run the Sprint 004 administrator command to set `reviewer: true`; Firebase Console cannot set custom claims.
5. Ask the reviewer to sign in after the dashboard Email/Password form is deployed.
6. Verify access to the review queue and verify that an unclaimed account receives `Unauthorized`.

## Recipe: recover or revoke access

- Password recovery: send a Firebase password-reset email to the existing account and confirm PurelyMail delivery.
- Revoke reviewer access: set `reviewer: false` or remove the claim, then revoke refresh tokens.
- Disable all access: disable or delete the Firebase user after confirming identity and retention needs.
- After a claim change, require sign-out/sign-in or token refresh before testing the new authorization state.

## Administration considerations

- Use least privilege: only trusted administrators may create users or change claims.
- Validate the exact normalized email; do not authorize the entire domain automatically.
- Record who approved, granted, tested, revoked, or deleted access and when.
- Do not confuse successful authentication with authorization to read inspection evidence.
- Treat provider settings, claims, dashboard deployment, and manual QA as separate completion gates.
- Review Identity Platform usage and Blaze billing before production-scale onboarding.
- The admin claim command and dashboard Email/Password UI do not exist yet; they are Sprint 004 work.
