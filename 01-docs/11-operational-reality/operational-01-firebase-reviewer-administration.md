# Firebase Reviewer Administration

HumanReviewerInitials:

## Observed configuration — 2026-08-10

- Firebase project: `aishop-99d36`; billing plan: Blaze.
- Firebase Authentication with Identity Platform is enabled; this upgrade is irreversible.
- Email/Password and Google providers are enabled.
- End-user account creation is **enabled**, so customers can self-register; end-user deletion remains disabled.
- Email-enumeration protection remains enabled.
- An iOS app is registered for bundle ID `ai.elustondo.AIShop`.
- The deployed dashboard offers Google sign-in only.
- The server accepts a verified Firebase token for the review queue only when `reviewer === true`.

## Decisions

- The review dashboard is invitation-only; it has no registration form.
- A Firebase account and reviewer authorization are separate controls.
- Signing in does not grant access; an administrator must also grant the reviewer claim.
- Customer self-registration is delivered and does not grant any reviewer access.

## Recipe: invite a reviewer

1. Confirm the intended person and their exact Google-authenticatable address with the administrator.
2. Ask them to open the [dashboard](https://aishop-99d36.web.app) and sign in with Google once. Firebase creates the user record on first successful sign-in; nothing is pre-created in the Console.
3. Grant `reviewer: true` on that UID with an Admin SDK `setCustomUserClaims` call. The Firebase Console cannot set custom claims, and no committed tool does this yet.
4. Have them sign out and back in so the refreshed token carries the claim.
5. Verify review-queue access, and verify an unclaimed account receives `Unauthorized`.

## Recipe: recover or revoke access

- Revoke reviewer access: set `reviewer: false` or remove the claim, then revoke refresh tokens.
- Disable all access: disable or delete the Firebase user after confirming identity and retention needs.
- After a claim change, require sign-out/sign-in or token refresh before testing the new authorization state.

## Known gaps

- Reviewers must have a Google-authenticatable identity; there is no Email/Password path on the dashboard.
- Granting a claim is a manual Admin SDK call with no audited, committed tool.

## Administration considerations

- Use least privilege: only trusted administrators may change claims.
- Validate the exact normalized email; do not authorize the entire domain automatically.
- Record who approved, granted, tested, revoked, or deleted access and when.
- Do not confuse successful authentication with authorization to read inspection evidence.
- Review Identity Platform usage and Blaze billing before production-scale onboarding.
