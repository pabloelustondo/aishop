# Firebase Customer Authentication

HumanReviewerInitials: PME

## Firebase setup

- Register an iOS Firebase app using the exact Xcode bundle identifier.
- Add FirebaseCore and FirebaseAuth; add GoogleSignIn only if Google authentication is required.
- Download `GoogleService-Info.plist`, add it to the application target, and confirm it is copied into the built `.app`.
- Add `REVERSED_CLIENT_ID` as a `CFBundleURLSchemes` entry for Google callbacks.
- Enable Email/Password and Google providers; customer self-registration also requires **Enable create (sign-up)**.

## Startup order

Call `FirebaseApp.configure()` before constructing anything that calls `Auth.auth()`. AI Shop initializes its `StateObject<AuthSession>` only after configuration; reversing this order can terminate or black-screen at launch.

## Session behavior

- `addStateDidChangeListener` maps Firebase state to checking, signed-out, authenticating, or signed-in UI.
- Email registration uses `createUser(withEmail:password:)`.
- Email sign-in uses `signIn(withEmail:password:)`.
- Password recovery uses `sendPasswordReset(withEmail:)`.
- Google Sign-In exchanges the Google ID/access tokens for a Firebase credential, then calls Firebase `signIn(with:)`.
- Sign-out calls Firebase Auth `signOut()`; the camera is accessible only while signed in.

## Request authentication

Immediately before every API request, read `Auth.auth().currentUser` and call `getIDToken()`. Send the returned token as:

```http
Authorization: Bearer <firebase-id-token>
```

Do not cache a token permanently, send a UID as proof, or trust an email from the request body. Firebase refreshes expiring tokens; the server verifies signature, audience, issuer, expiry, and returns the trusted `uid`.

## Server authorization

`firebase-admin/auth.getAuth(app).verifyIdToken(token)` authenticates the request. Any verified Firebase user may submit as a customer. Reviewer-only routes additionally require the custom claim `reviewer === true`.
