#!/usr/bin/env bash
# Local read only. Enter the folder printed by Test 017, without quotes.
read -r -p 'Download folder: ' QA_ERROR_FOLDER
if [[ -f "$QA_ERROR_FOLDER/original-video" ]]; then
  if [[ ! -s "$QA_ERROR_FOLDER/original-video" ]]; then
    echo 'The saved response is empty (0 bytes). No error message was returned; inspect server logs.'
    return 1 2>/dev/null || exit 1
  fi
  jq '{error:(.error | if type == "object" then
    {code,message:(.message | if type == "string" then
      gsub("https?://[^[:space:]<>]+"; "[URL redacted]") else . end),retryable,requestId}
    else null end)}' "$QA_ERROR_FOLDER/original-video"
else
  echo 'Saved response not found.' >&2
fi
