# Sprint 005 Closure and Development Deployment Evidence

HumanReviewerInitials:

Status: CANDIDATE — requires PME review

## Identity and target

- Reviewed source commit: `5eb173020c29c65e605d348648ce0b1ff63e0d98`.
- `main` merge commit: `0ec8b9825d9307a2676f7d43cb9f9f55d3b4c220`.
- Both commits have tree `d9f74ddf0a551c8b1152156d50a7a13e32b1a9fc`.
- PME's work order designated Firebase project `aishop-99d36` as development.
- Deployed function: `api`, Node 22, `northamerica-northeast2`, ACTIVE.
- URL: `https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api`.
- Runtime: 30 seconds, 256 MiB, one instance, concurrency one.

## Closure and deployment evidence

- `npm test`: 158/158 pass; `./e2e/server/run.zsh`: 3/3 pass.
- Startup verifier PASS; handoff verifier PASS; 41/41 checksums OK.
- Local exact-25-MiB: `201` in 9.240 s; retry `200` in 7.761 s; RSS 348,717,056 B.
- PR #2 used a merge commit into `main`; no squash or branch deletion.
- Function-only deploy and its mandatory predeploy VISTA-limit check: PASS.
- Live inventory confirms all nine approved limits and no secret changes.

## Real development smoke

- A unique real Firebase test user authenticated; `/health` returned `200`.
- Golden upload `201`; identical retry `200`; same receipt `6f72b75f-954d-4546-86e9-67c199635c4a`.
- Firestore is `received` for run `2c11d24c-86da-4ae9-9be4-d67308e27389`.
- GCS lists exactly three objects: manifest 1,267 B, audit 2,553 B, JPEG 865 B.
- GCS MD5, size, custom SHA-256, content type, and `private, no-store` all match.
- Public access prevention and uniform access are on; no public IAM principal.

## Deviations, retained evidence, and conditions

- Two verification attempts stopped safely: one temporary module-path error;
  then missing local object-download permission. Neither changed IAM.
- Service-account impersonation was denied; authorized metadata verification
  completed without adding permissions or downloading private evidence.
- The test user and smoke package remain retained; deletion was unauthorized.
- Older docs call the same URL production; PME's current work order controlled.
- The local peak exceeds 256 MiB; the small golden smoke does not qualify a
  maximum legal package on deployed infrastructure.
- VISTA iPhone upload remains outside Sprint 005 and is not yet end-to-end.

## Recommendation

**ACCEPT WITH CONDITIONS** for development deployment; govern maximum-load
qualification, environment naming, retained smoke data, and VISTA iPhone work.
