# Task-function invoker deployment — 2026-09-14

Environment: TEST, Firebase project `aishop-99d36`.

## Observations

- The earlier deployment reported an invoker-policy failure for `processAgentVideo`.
- A subsequent live read showed the function ACTIVE, created at 13:48:45 UTC,
  with its latest update at 18:46:26 UTC. It was not absent from the project.
- The existing Cloud Run policy granted `roles/run.invoker` to the configured
  task service account; a CLI failure alone did not prove invocation was broken.
- A live enabled-services query confirmed `compute.googleapis.com` was disabled.
- Pablo authorized enabling it and redeploying just the video task function.
- The API enable operation completed successfully.
- The targeted redeploy still failed with the invoker error and
  `Cannot read properties of undefined (reading 'filter')` in Firebase CLI 15.26.0.
- After that failure, Cloud Run reported `processagentvideo-00003-xiy` ready
  with 100% traffic and the existing task service account's invoker grant intact.
- Enabling Compute Engine API did not resolve the CLI failure. Its remaining
  cause and a real video run are unverified; do not describe the deploy as clean.

## Recovery recipe

Check API availability when Firebase reports a default compute service-account
lookup or task-function invoker failure. For this TEST environment:

```sh
gcloud services enable compute.googleapis.com --project aishop-99d36
firebase deploy --only functions:processAgentVideo --project aishop-99d36
```

Wait for API activation to complete before deploying. Then verify the function's
ready revision and its underlying Cloud Run invoker policy. Do not make the
worker public as a workaround. Check an authenticated video run separately;
a successful deployment does not prove upload or processing success.

## Boundaries

An `uploading` record has not yet reached video processing. Repairing a worker
deployment does not by itself complete an interrupted Storage transfer.
This observation does not establish that Compute Engine API is a universal
prerequisite for all task-function deployments.

The public API is in `northamerica-northeast2` (Toronto); task functions are in
`northamerica-northeast1` (Montréal). This split is already recorded in
[the video deployment recipe](operational-09-sprint-014-video-deployment.md).
No regional migration is part of this repair.
