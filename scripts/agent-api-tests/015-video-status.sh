#!/usr/bin/env bash
# SOURCE in the same Bash session. One read only; does not start or repeat work.
if [[ -z "${TOKEN:-}" || ! "${ID:-}" =~ ^[a-f0-9]{32}$ ]]; then
  echo 'Sign-in token or valid reservation ID missing.' >&2
else
  printf 'Authorization: Bearer %s\n' "$TOKEN" |
    curl -sS --connect-timeout 10 --max-time 30 \
      "https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses/$ID" \
      -H @- -w '\nHTTP status: %{http_code}\n' |
    jq -Rrs 'split("\nHTTP status: ") as $p | ($p[0]|fromjson) as $b |
      {httpStatus:($p[1]|tonumber),analysisId:$b.analysis.analysisId,
       status:$b.analysis.status,failureReason:($b.analysis.failureReason // null),
       hasReport:($b.analysis.report != null),error:($b.error // null)}'
fi
