#!/usr/bin/env bash
# SOURCE only after Storage confirms completion. Starts processing and may incur AI cost.
if [[ -z "${TOKEN:-}" || ! "${ID:-}" =~ ^[a-f0-9]{32}$ ]]; then
  echo 'Sign-in token or valid reservation ID missing.' >&2
else
  printf 'Authorization: Bearer %s\n' "$TOKEN" |
    curl -sS --connect-timeout 10 --max-time 30 -X POST \
      "https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/video-uploads/$ID/complete" \
      -H @- -w '\nHTTP status: %{http_code}\n' |
    jq -Rrs 'split("\nHTTP status: ") as $p | ($p[0]|fromjson) as $b |
      {httpStatus:($p[1]|tonumber),analysisId:$b.analysis.analysisId,
       status:$b.analysis.status,error:($b.error // null)}'
fi
