# Agent API — 3. Errors and limits

Every error answers `{ "error": { "code", "message", "retryable", "requestId" } }`. `code` and
`retryable` are stable and safe to branch on; `message` is for people and may change. `X-Request-ID`
on every response equals `requestId`; quote it when reporting a problem. The single call adds
`analysisId` when the upload succeeded but background start did not answer cleanly.

## Codes

| Status | `code` | Retry the identical request? |
| --- | --- | --- |
| 400 | `multipart_invalid`, `file_missing`, `file_count_invalid`, `file_not_jpeg`, `file_dimensions_invalid`, `context_invalid` | no — fix the request |
| 400 | `context_required` | no — a refine of an analysed record needs a note |
| 401 | `unauthorized` | no — sign in again ([01](01-getting-a-token.md)) |
| 403 | `forbidden` | no — the account is not authorized; ask Pablo |
| 404 | `not_found`, `analysis_not_found` | no |
| 405 | `method_not_allowed` | no |
| 409 | `analysis_state_invalid`, `analysis_run_limit`, `source_exists` | no |
| 413 | `file_too_large` | no |
| 415 | `media_type_unsupported` | no |
| 502 | `provider_failed` | yes, after the record is `failed` |
| 503 | `storage_unavailable` | yes |
| 504 | `provider_timeout` | no while `analyzing`; report the `requestId` |
| 500 | `unexpected_server_error` | yes, once; then report the `requestId` |

## Limits

- File: one JPEG per call, ≤ 5 MB, each side ≤ 4096 px. Only `image/jpeg` is accepted.
- Note: ≤ 500 characters after trimming. Longer is refused, never truncated.
- Runs per analysis: 25. Each refine or retry is one run.
- Provider analysis has no supplied output-token cap and runs outside the HTTP request.
- Provider start, retrieve and delete transports each stop after 15 s; this does not limit analysis.
- Public status polling is read-only; provider/task identifiers remain server-private.
- Recognition: follows `areaScan`; facing counts inherit the open benchmark gaps.

## Not promised

Completion latency, row order between runs, throughput, unlisted endpoints, and any route under
`/v1/vista/`. An uncertain provider start can remain `analyzing` for operator investigation; it is
never automatically repeated because that could create a second billed provider request.
