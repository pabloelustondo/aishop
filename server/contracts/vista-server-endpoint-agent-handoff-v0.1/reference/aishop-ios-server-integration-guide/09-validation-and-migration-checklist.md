# Validation and Migration Checklist

HumanReviewerInitials:

## Authentication

- [ ] Fresh Email/Password registration reaches the camera.
- [ ] Existing Email/Password sign-in works after app restart.
- [ ] Password reset reaches the mailbox.
- [ ] Google sign-in returns through the configured URL scheme.
- [ ] Signed-out submission sends no request; invalid/expired token receives `401`.

## Image and contract

- [ ] Captured/library input is converted to a genuine JPEG.
- [ ] Decoded JPEG remains below 5 MiB and Base64 contains no data-URL prefix.
- [ ] Both modes send the exact five fields and correct target position/null.
- [ ] Server rejects PNG/HEIC mislabeled as JPEG, malformed Base64, oversized bytes, extra fields, and invalid coordinates.
- [ ] Success decodes only when response mode matches request mode.

## Ownership and persistence

- [ ] Firestore `ownerId` equals verified Firebase UID, never a client value.
- [ ] Customer A cannot read Customer B's scan ID.
- [ ] Stored SHA-256 and byte length match the uploaded JPEG.
- [ ] Storage overwrite attempts fail and objects are not public.
- [ ] Provider failure records immutable evidence and a failed audit record.

## End-to-end evidence

- [ ] Physical iPhone submits target-product and area-scan photos.
- [ ] Returned reports render all required schema fields.
- [ ] Health endpoint returns `200`; direct protected endpoint returns `401`.
- [ ] Automated iOS and server suites pass from a clean checkout.
- [ ] Deployment project, region, function revision, app build, and test accounts are recorded.

## Migration warnings

- Do not copy `GoogleService-Info.plist` between bundle IDs.
- Do not restore the static client-token authentication path.
- Do not assume existing ownerless POC records belong to a new customer.
- Do not call Sprint integration complete from a build alone; prove authentication, submission, isolation, persistence, and physical-device behavior.
