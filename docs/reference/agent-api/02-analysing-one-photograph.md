# Agent API — 2. Analysing one photograph

One `POST` uploads a JPEG, starts durable background analysis and returns promptly. Base:
`https://aishop-99d36.web.app/v1/agent/analyses` (TEST). The token comes from [01](01-getting-a-token.md).

## The single call

```sh
curl -s -i -X POST "https://aishop-99d36.web.app/v1/agent/analyses" \
  -H "Authorization: Bearer {idToken}" \
  -F "file=@shelf.jpg;type=image/jpeg" \
  -F "run=true" \
  -F "context=Count every facing on the top shelf only."
```

| Part | Required | Meaning |
| --- | --- | --- |
| `file` | yes | one JPEG, ≤ 5 MB, ≤ 4096 px per side |
| `run` | no | the literal `true` starts analysis; anything else, or absent, stores only |
| `context` | no | ≤ 500 characters; the note the first run receives; ignored without `run` |

## The answer

`201` with `{ "analysis": … }`. With `run`, `analysis.status` is normally `analyzing`; the provider
response ID, Cloud Task and collection timing never appear in this public record. Without `run`,
`status` is `uploaded` and `runs` is empty. A later successful GET returns `status: analyzed` and the
`areaScan` report: `summary`, `identifiedProducts[]` with `name`, `count`, `confidence`,
`visibleEvidence[]`, and `uncertainItems[]`.

Poll `GET …/analyses/{analysisId}` every 15 seconds while the record is `analyzing`. Stop at a terminal
state; a page reload may resume the same GET polling because progression and identity live server-side.
Polling never starts, retrieves or retries provider work, and there is no public collection route.

## When the run fails after the upload succeeded

The status is the run's own — `502 provider_failed`, `504 provider_timeout`, `503 storage_unavailable` —
and the body carries `analysisId` beside `requestId`. **Do not upload again.** Retry only a record that
has settled `failed`:

```sh
curl -s -X POST "https://aishop-99d36.web.app/v1/agent/analyses/{analysisId}/run" \
  -H "Authorization: Bearer {idToken}" -H "content-type: application/json" \
  -d '{"context":"Count every facing on the top shelf only."}'
```

## Reading back

`GET …/analyses` lists your analyses newest first; `GET …/analyses/{id}` returns one record;
`GET …/analyses/{id}/source` returns the stored JPEG bytes (`Cache-Control: private, no-store`).
Another caller's analysis is `404 analysis_not_found` on every route.
