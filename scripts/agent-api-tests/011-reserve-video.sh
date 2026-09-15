#!/usr/bin/env bash
# SOURCE after sign-in. Creates ONE reservation; sends no video bytes or AI request.
# Do not repeat after a timeout: check the Agent list for an existing reservation first.
aishop_reserve_video() {
  local file reply body http
  [[ -n "${TOKEN:-}" ]] || { echo 'Run sign-in first.' >&2; return 1; }
  [[ -z "${UPLOAD_URL:-}" ]] || { echo 'An upload session is already held; inspect it first.' >&2; return 1; }
  read -r -p 'Full video path (without quotes): ' file || return 1
  [[ -f "$file" && -r "$file" ]] || { echo 'File not found or unreadable.' >&2; return 1; }
  case "$file" in
    *.[mM][pP]4) MEDIA='video/mp4' ;;
    *.[mM][oO][vV]) MEDIA='video/quicktime' ;;
    *) echo 'Choose an MP4 or MOV file.' >&2; return 1 ;;
  esac
  VIDEO=$file
  BYTES=$(stat -f%z "$VIDEO") || return 1
  (( BYTES > 0 )) || { echo 'File is empty.' >&2; return 1; }
  reply=$(jq -n --arg name "$(basename "$VIDEO")" --arg media "$MEDIA" \
    --argjson bytes "$BYTES" '{fileName:$name,mediaType:$media,byteLength:$bytes}' |
    curl -sS --connect-timeout 10 --max-time 30 \
      'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/video-uploads' \
      -H @<(printf 'Authorization: Bearer %s\n' "$TOKEN") \
      -H 'Origin: https://aishop-99d36.web.app' \
      -H 'Content-Type: application/json' --data-binary @- \
      -w '\nHTTP status: %{http_code}\n') || {
        echo 'Request outcome uncertain; check the list before retrying.' >&2; return 1;
      }
  body=${reply%$'\nHTTP status: '*}
  http=${reply##*$'\nHTTP status: '}
  printf '%s' "$body" | jq --arg http "$http" \
    '{httpStatus:($http|tonumber),analysisId:.analysis.analysisId,status:.analysis.status,
      hasUploadSession:(.upload.uri|type == "string"),error:(.error // null)}' || return 1
  [[ "$http" == 201 ]] || return 1
  ID=$(printf '%s' "$body" | jq -er '.analysis.analysisId') || return 1
  UPLOAD_URL=$(printf '%s' "$body" | jq -er '.upload.uri') || return 1
}
aishop_reserve_video
