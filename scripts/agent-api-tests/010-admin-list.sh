#!/usr/bin/env bash
# SOURCE after sign-in. Read-only; hides filenames, owner identities and reports.
if [[ -z "${TOKEN:-}" ]]; then
  printf 'Run sign-in first.\n' >&2
else
  printf 'Authorization: Bearer %s\n' "$TOKEN" |
    curl -sS --connect-timeout 10 --max-time 30 \
      'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/admin/analyses?limit=25' \
      -H @- -w '\nHTTP status: %{http_code}\n' |
    jq -Rrs 'split("\nHTTP status: ") as $p | ($p[0]|fromjson) as $b |
      {httpStatus:($p[1]|tonumber),hasAnalyses:($b.analyses|type == "array"),
       analysisCount:(if ($b.analyses|type) == "array" then ($b.analyses|length) else null end),
       error:($b.error // null)}'
fi
