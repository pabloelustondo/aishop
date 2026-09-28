#!/usr/bin/env bash
# Source in your test shell; variables stay in memory. Run from the repo root.
(
set +x
set -euo pipefail
: "${BASE:?Set the API base explicitly, without a trailing slash.}"
: "${TOKEN:?Sign in first; never paste the token into this file.}"
: "${ANALYSIS_ID:?Set an existing JPEG analysis ID owned by this caller.}"
[[ "$BASE" =~ ^https?://[A-Za-z0-9.:-]+(/[A-Za-z0-9_-]+)*$ ]] || { echo "Invalid BASE." >&2; exit 1; }
[[ "$TOKEN" =~ ^[A-Za-z0-9._-]+$ ]] || { echo "Invalid TOKEN shape." >&2; exit 1; }
[[ "$ANALYSIS_ID" =~ ^[A-Za-z0-9_-]{1,64}$ ]] || { echo "Invalid ANALYSIS_ID." >&2; exit 1; }
: "${CONTEXT:?Set a non-empty refinement instruction.}"
body=$(jq -cn --arg context "$CONTEXT" '{context:$context}')
# Pass authorization on stdin, not in curl's process arguments. Ignore .curlrc.
printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" |
curl -q -sS --connect-timeout 10 --max-time 30 --config - \
  -X POST "$BASE/v1/agent/analyses/$ANALYSIS_ID/run" \
  -H "Content-Type: application/json" --data-binary "$body" \
  -w '\n%{http_code}' |
jq -Rrs 'split("\n") | .[-1] as $status |
  (.[0:-1] | join("\n") | fromjson) as $body |
  {httpStatus:($status|tonumber),analysisId:$body.analysis.analysisId,status:$body.analysis.status,runCount:$body.analysis.runCount,error:$body.error}'
)
