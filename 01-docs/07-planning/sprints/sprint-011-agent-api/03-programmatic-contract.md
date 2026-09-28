# Sprint 011 — Programmatic Contract

What a script sees. Existing routes do not change; the sprint adds the two fields in step 2. Base: `https://aishop-99d36.web.app/v1/agent/analyses` (TEST).

## Step 1 — token (Firebase, not our server)

`POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={webApiKey}`
Body `{"email":"…","password":"…","returnSecureToken":true}` → `idToken`, `refreshToken`, `expiresIn` (3600).
The account was created and authorized by Pablo ([02](02-credential-decisions.md)); there is no sign-up call.
Every call below sends `Authorization: Bearer {idToken}`. Missing or invalid token: `401 unauthorized`.
Valid token without the `agent` authorization: `403 forbidden`, on every route below, source included.

## Step 2 — single call (new fields on the existing upload route)

`POST /v1/agent/analyses` as `multipart/form-data` with parts:

| Part | Required | Meaning |
| --- | --- | --- |
| `file` | yes | one JPEG, ≤ 5 MB, ≤ 4096 px per side, as today |
| `run` | no | `true` — analyse before answering; absent means store only, as today |
| `context` | no | ≤ 500 characters, only meaningful with `run`; the note the first run receives |

Responses:

- `201` with `{ analysis }` where `status` is `analyzed`, `runs[0]` is the settled run and `report` holds the `areaScan` result.
- `201` with `status: uploaded` when `run` is absent — unchanged behaviour.
- A run that fails answers the run's own error — `502 provider_failed`, `504 provider_timeout`, `503 storage_unavailable` — and the body carries `analysisId`, so the caller retries with `POST /v1/agent/analyses/{id}/run` instead of uploading again.
- Upload errors are unchanged: `400 file_missing | file_not_jpeg | file_dimensions_invalid | multipart_invalid`, `413 file_too_large`, `415 media_type_unsupported`, `400 context_invalid`.

## Existing routes, unchanged

| Route | Purpose |
| --- | --- |
| `POST …/{id}/run` with `{"context":"…"}` | retry a failed run, or refine an analysed one (note required) |
| `GET …/{id}` | the record: status, runs, report, diagnostics summary |
| `GET …` | the caller's analyses, newest first |
| `GET …/{id}/source` | the stored JPEG bytes, `Cache-Control: private, no-store` |

Another owner's analysis is `404 analysis_not_found` on every route. Run limits and state refusals stay `409`.
A newly granted authorization is in the *next* token: sign in again after Pablo grants it.

## Headers a script should keep

`X-Request-ID` on every response is the diagnostic reference; quote it when reporting a failure.
The error body is `{ error: { code, message, retryable, requestId } }`; `code` and `retryable` are stable, `message` is not a contract.
The single call adds `analysisId` beside `requestId` when the upload succeeded and the run did not.

## Not promised

Row order between runs; latency beyond the 120 s timeout; concurrent throughput; unlisted endpoints. Facings follow `areaScan` and the open benchmark-04 gaps.
