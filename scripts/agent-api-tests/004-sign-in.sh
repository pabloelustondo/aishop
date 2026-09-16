#!/usr/bin/env bash
# SOURCE in Bash to keep TOKEN for subsequent tests. Never enable shell tracing.
aishop_sign_in() {
  local key email password auth token_value
  unset TOKEN
  key=$(curl -fsS --connect-timeout 10 --max-time 30 \
    'https://aishop-99d36.web.app/__/firebase/init.json' | jq -er '.apiKey') || return 1
  read -r -p 'Firebase email: ' email || return 1
  read -r -s -p 'Firebase password: ' password || return 1
  printf '\n'
  auth=$(printf '%s' "$password" |
    jq -Rs --arg email "$email" '{email:$email,password:.,returnSecureToken:true}' |
    curl -sS --connect-timeout 10 --max-time 30 \
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$key" \
      -H 'Content-Type: application/json' --data-binary @-) || return 1
  unset password
  printf '%s' "$auth" | jq '{signedIn:(.idToken != null),expiresIn,error:(.error.message // null)}'
  token_value=$(printf '%s' "$auth" | jq -er '.idToken // empty') || return 1
  TOKEN=$token_value
}
aishop_sign_in
