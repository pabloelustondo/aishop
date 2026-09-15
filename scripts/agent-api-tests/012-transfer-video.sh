#!/usr/bin/env bash
# SOURCE in the reservation's Bash session. Transfers bytes; does not call /complete.
aishop_transfer_video() {
  local reply
  [[ -n "${UPLOAD_URL:-}" && -f "${VIDEO:-}" && -n "${BYTES:-}" && -n "${MEDIA:-}" ]] || {
    echo 'Reservation variables or original video missing.' >&2; return 1;
  }
  [[ "$(stat -f%z "$VIDEO")" == "$BYTES" ]] || {
    echo 'Video size changed since reservation; stop and inspect.' >&2; return 1;
  }
  # Keep the private session URL out of process arguments; reject config metacharacters.
  [[ "$UPLOAD_URL" == https://* && "$UPLOAD_URL" != *$'\n'* && "$UPLOAD_URL" != *$'\r'* && "$UPLOAD_URL" != *'"'* && "$UPLOAD_URL" != *'\'* ]] || return 1
  reply=$(printf 'url = "%s"\n' "$UPLOAD_URL" |
    curl --config - --silent --show-error --connect-timeout 10 --max-time 300 \
      -X PUT -H "Content-Type: $MEDIA" \
      -H "Content-Range: bytes 0-$((BYTES - 1))/$BYTES" \
      --data-binary "@$VIDEO" -w '\nHTTP status: %{http_code}\n') || {
        echo 'Transfer outcome uncertain; inspect session before retrying.' >&2; return 1;
      }
  printf '%s' "$reply" | jq -Rrs 'split("\nHTTP status: ") as $p |
    {httpStatus:($p[1]|tonumber),
     storageCode:((try ($p[0]|fromjson|.error.errors[0].reason // .error.code) catch null)
       // (try ($p[0]|capture("<Code>(?<code>[^<]+)</Code>").code) catch null))}'
}
aishop_transfer_video
