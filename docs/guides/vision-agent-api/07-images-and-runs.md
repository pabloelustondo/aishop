# JPEG upload, first run and refinement

Prerequisite: authentication; use a valid JPEG as a baseline independent of video.
JPEG is multipart; curl must generate the multipart Content-Type boundary.
```sh
IMAGE='/absolute/path/to/shelf.jpeg'
PHOTO=$(curl -sS --fail-with-body "$BASE/v1/agent/analyses"   -H "Authorization: Bearer $TOKEN" -F "file=@$IMAGE;type=image/jpeg")
PHOTO_ID=$(printf '%s' "$PHOTO" | jq -er '.analysis.analysisId')
printf '%s' "$PHOTO" | jq '.analysis'
curl -i -X POST "$BASE/v1/agent/analyses/$PHOTO_ID/run"   -H "Authorization: Bearer $TOKEN"
```

Upload alone: 201 uploaded. Run: 200 with analysis, normally analyzing.
Poll GET /v1/agent/analyses/$PHOTO_ID until analyzed/failed.
The image and report use the same detail/source endpoints as video.

## Combined JPEG upload plus first run

```sh
curl -i "$BASE/v1/agent/analyses" -H "Authorization: Bearer $TOKEN"   -F "file=@$IMAGE;type=image/jpeg" -F 'run=true'
```

Expected 201 after successful background initiation, not necessarily final analysis.
If upload succeeds but initiation fails, the error may include analysisId.
Do not create another upload before inspecting that record.

## Refine an analyzed photograph

```sh
curl -i -X POST "$BASE/v1/agent/analyses/$PHOTO_ID/run"   -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json'   --data '{"context":"Focus on visible front-facing products."}'
```

Expect a new run entry. Calling run on analyzed with no meaningful note: 400 context_required.
A failed image run can retry without a note; preserve the prior note for a failed refinement.
An active run should refuse another run with 409 analysis_state_invalid.
More than 500 note characters: 400 context_invalid; run count ceiling: 25.
Zero files: 400 file_missing; two files: 400 file_count_invalid.
A PNG declared as image/jpeg must fail validation, not be silently converted.
JPEG byte/pixel limits are listed in [limits](11-limits-and-gaps.md).
Do not use video /run as a healthy baseline: its attempt propagation is an open gap.
