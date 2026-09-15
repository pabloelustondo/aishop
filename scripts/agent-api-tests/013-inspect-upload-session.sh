#!/usr/bin/env bash
# SOURCE after transfer failure. Queries status only; sends no video bytes.
aishop_inspect_upload() {
  local reply
  [[ -n "${UPLOAD_URL:-}" && "${BYTES:-}" =~ ^[0-9]+$ ]] || return 1
  [[ "$UPLOAD_URL" == https://* && "$UPLOAD_URL" != *$'\n'* && "$UPLOAD_URL" != *$'\r'* && "$UPLOAD_URL" != *'"'* && "$UPLOAD_URL" != *'\'* ]] || return 1
  reply=$(printf 'url = "%s"\n' "$UPLOAD_URL" |
    curl --config - -sS --connect-timeout 10 --max-time 30 \
      -D - -X PUT -H "Content-Range: bytes */$BYTES" --data-binary '' \
      -w '\nHTTP status: %{http_code}\n') || return 1
  printf '%s' "$reply" | node -e '
    let text = "";
    process.stdin.on("data", chunk => text += chunk);
    process.stdin.on("end", () => {
      const marker = text.lastIndexOf("\nHTTP status: ");
      const response = text.slice(0, marker);
      const bodyStart = response.indexOf("\r\n\r\n");
      const body = response.slice(bodyStart + 4).trim();
      let error = {};
      try { error = JSON.parse(body).error || {}; } catch {}
      const clean = value => typeof value === "string"
        ? value.replace(/https?:\/\/[^\s<>"\x27]+/g, "[URL redacted]").slice(0, 1500) : value;
      console.log(JSON.stringify({
        httpStatus: Number(text.slice(marker + 14).trim()),
        range: response.match(/^range:\s*([^\r\n]+)/im)?.[1] || null,
        storageCode: clean(error.errors?.[0]?.reason || error.code || body.match(/<Code>([^<]+)<\/Code>/)?.[1] || null),
        message: clean(error.message || body.match(/<Message>([^<]+)<\/Message>/)?.[1] || null)
      }, null, 2));
    });'
}
aishop_inspect_upload
