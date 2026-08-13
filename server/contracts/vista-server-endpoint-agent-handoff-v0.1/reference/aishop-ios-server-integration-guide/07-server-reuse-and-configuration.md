# Server Reuse and Configuration

HumanReviewerInitials:

## Reuse choices

Choose whether the second app shares the existing Firebase project/API or deploys an isolated project. Sharing gives both apps the same authentication issuer, Storage bucket, Firestore collection, model configuration, quotas, and operational blast radius.

For isolation, create another Firebase project or explicitly namespace records and storage. Do not point a production app at the POC without deciding retention, billing, access, and ownership boundaries.

## Required runtime configuration

- Node.js 22 Firebase Functions runtime.
- Firebase Admin default credentials supplied by the Functions environment.
- Firestore and Cloud Storage enabled in the selected project.
- `OPENAI_API_KEY` stored as a Firebase Functions secret.
- Optional `OPENAI_MODEL`; otherwise the code uses `gpt-5.4-mini`.
- Function region `northamerica-northeast2`, 30-second timeout, 256 MiB memory, one instance, concurrency one in the current POC.

## Reusing the current API

1. Register the second iOS bundle ID as another iOS app in Firebase project `aishop-99d36`.
2. Give it its own downloaded Firebase plist and Google callback scheme.
3. Use the same production base URL and request contract.
4. Confirm the enabled Firebase providers and customer sign-up setting.
5. Verify the server accepts its ID tokens; Firebase apps in the same project share the issuer/audience.

## Deploying an isolated API

1. Provision the Firebase project, Authentication providers, Firestore, Storage, Functions, and secrets.
2. Deploy the `api` function and record the exact regional URL.
3. Put that URL into the second app's environment-specific build setting.
4. Run health, unauthorized, valid-token, JPEG, provider-failure, and persistence checks.
5. Keep development, test, and production resources and secrets distinct.

The legacy `AI_SHOP_CLIENT_TOKEN` remains attached to the older `/analyze-product` route; the authenticated `/inspections` integration does not use it.
