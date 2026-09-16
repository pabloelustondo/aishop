#!/usr/bin/env bash
# SOURCE in the same Bash session. Read-only server request; keeps a temporary download.
aishop_verify_original() {
  local folder http local_hash stored_hash
  [[ -n "${TOKEN:-}" && "${ID:-}" =~ ^[a-f0-9]{32}$ && -f "${VIDEO:-}" ]] || {
    echo 'Token, analysis ID or local video missing.' >&2; return 1;
  }
  folder=$(mktemp -d "${TMPDIR:-/tmp}/aishop-original.XXXXXX") || return 1
  printf 'Download folder: %s\n' "$folder"
  http=$(printf 'Authorization: Bearer %s\n' "$TOKEN" |
    curl -sS --connect-timeout 10 --max-time 300 \
      "https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses/$ID/source" \
      -H @- --output "$folder/original-video" -w '%{http_code}') || return 1
  if [[ "$http" != 200 ]]; then
    printf 'HTTP %s; checksum comparison skipped. Response retained in download folder.\n' "$http"
    return 1
  fi
  local_hash=$(shasum -a 256 "$VIDEO" | awk '{print $1}') || return 1
  stored_hash=$(shasum -a 256 "$folder/original-video" | awk '{print $1}') || return 1
  jq -n --arg local "$local_hash" --arg stored "$stored_hash" \
    '{httpStatus:200,localSha256:$local,storedSha256:$stored,identical:($local == $stored)}'
  [[ "$local_hash" == "$stored_hash" ]]
}
aishop_verify_original
