#!/bin/bash
# Vision Agent API — curl acceptance suite against TEST.
#
# Runs the documented contract (docs/guides/vision-agent-api) end to end and
# reports every check as PASS or FAIL with the status it actually got. It keeps
# going after a failure so one run shows the whole picture. Exit 1 if any FAIL.
#
#   AISHOP_TEST_EMAIL=you@example.com AISHOP_TEST_PASSWORD=… \
#   AISHOP_VIDEO=~/Downloads/VISTA_TEST_VIDEO_1.mp4 \
#   bash server/scripts/curl-tests/run.sh
#
# Optional: AISHOP_JPEG (default: the bundled fixture), AISHOP_ADMIN_EMAIL and
# AISHOP_ADMIN_PASSWORD (admin reads), AISHOP_OTHER_EMAIL/PASSWORD (a second
# agent account, for isolation checks), AISHOP_SKIP_PROVIDER=1 (no /run or
# /complete, so no provider spend), AISHOP_POLL_SECONDS (default 600).
#
# Never prints tokens, passwords or upload URLs. Log: build/curl-tests/<UTC>.log.
# Every record it creates is disposable and is cancelled at the end if active.

set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd -P)"
BASE="${AISHOP_BASE:-https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api}"
ORIGIN="${AISHOP_ORIGIN:-https://aishop-99d36.web.app}"
JPEG="${AISHOP_JPEG:-$REPO/server/contracts/vista-server-endpoint-agent-handoff-v0.1/fixtures/valid/accepted-detail.jpg}"
VIDEO="${AISHOP_VIDEO:-}"
POLL="${AISHOP_POLL_SECONDS:-600}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOGDIR="$REPO/build/curl-tests"; mkdir -p "$LOGDIR"
LOG="$LOGDIR/$STAMP.log"; WORK="$(mktemp -d)"
PASSES=0; FAILS=0; SKIPS=0; CREATED=""
for tool in curl jq; do command -v "$tool" >/dev/null || { echo "need $tool"; exit 2; }; done

log()  { printf '%s\n' "$*" >>"$LOG"; }
say()  { printf '%s\n' "$*"; log "$*"; }
skip() { SKIPS=$((SKIPS+1)); say "SKIP  $1 — $2"; }
# http METHOD URL [curl args…] → sets STATUS and BODY (file). Redacts nothing
# because nothing secret is ever put in a URL or body we log; headers are not logged.
http() {
  local method="$1" url="$2"; shift 2
  BODY="$WORK/body.$RANDOM"
  STATUS="$(curl -sS -o "$BODY" -w '%{http_code}' -X "$method" "$url" "$@" 2>>"$LOG")" || STATUS="000"
  log "  -> $method ${url#"$BASE"} $STATUS $(head -c 300 "$BODY" | tr '\n' ' ' | sed -E 's/(uri|token|idToken)"?:"?[^",} ]+/\1:<redacted>/g')"
}
check() { # check NAME EXPECTED [EXPECTED…] — compares against $STATUS
  local name="$1"; shift; local hit=0 exp
  for exp in "$@"; do [ "$STATUS" = "$exp" ] && hit=1; done
  if [ $hit -eq 1 ]; then PASSES=$((PASSES+1)); say "PASS  $name ($STATUS)"
  else FAILS=$((FAILS+1)); say "FAIL  $name — expected $* got $STATUS: $(head -c 200 "$BODY" | tr '\n' ' ')"; fi
}
field() { jq -er "$1" "$BODY" 2>/dev/null; }
signin() { # signin EMAIL PASSWORD → prints idToken; never logged
  jq -n --arg e "$1" --arg p "$2" '{email:$e,password:$p,returnSecureToken:true}' |
    curl -sS "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$WEB_KEY" \
      -H 'Content-Type: application/json' --data-binary @- | jq -er '.idToken'
}
AUTH() { printf 'Authorization: Bearer %s' "$1"; }
poll() { # poll ID TOKEN → waits for a terminal status, sets STATUS/BODY to last read
  local id="$1" token="$2" waited=0 st
  while [ "$waited" -lt "$POLL" ]; do
    http GET "$BASE/v1/agent/analyses/$id" -H "$(AUTH "$token")"
    st="$(field .analysis.status)"
    case "$st" in analyzed|failed|cancelled) say "      settled: $st after ${waited}s"; return 0;; esac
    sleep 15; waited=$((waited+15))
  done
  say "      still $st after ${POLL}s"; return 1
}

say "Vision Agent API curl suite  $STAMP"; say "base $BASE"; say "log  $LOG"
say "commit $(git -C "$REPO" --no-optional-locks rev-parse --short HEAD 2>/dev/null)"

# ---- 0. setup and sign-in ---------------------------------------------------
: "${AISHOP_TEST_EMAIL:?set AISHOP_TEST_EMAIL}"; : "${AISHOP_TEST_PASSWORD:?set AISHOP_TEST_PASSWORD}"
WEB_KEY="$(curl -fsS "$ORIGIN/__/firebase/init.json" | jq -er '.apiKey')" || { say "FAIL  web api key"; exit 1; }
TOKEN="$(signin "$AISHOP_TEST_EMAIL" "$AISHOP_TEST_PASSWORD")" || { say "FAIL  sign-in"; exit 1; }
say "signed in as agent account"
ADMIN=""; [ -n "${AISHOP_ADMIN_EMAIL:-}" ] && ADMIN="$(signin "$AISHOP_ADMIN_EMAIL" "$AISHOP_ADMIN_PASSWORD")"
OTHER=""; [ -n "${AISHOP_OTHER_EMAIL:-}" ] && OTHER="$(signin "$AISHOP_OTHER_EMAIL" "$AISHOP_OTHER_PASSWORD")"

# ---- 1. health and authorization gates -------------------------------------
say ""; say "== 1 health and auth"
http GET "$BASE/health";                                   check "health" 200
http GET "$BASE/v1/agent/analyses";                        check "list without token is 401" 401
http GET "$BASE/v1/agent/analyses" -H "Authorization: Bearer not-a-token"; check "garbage token is 401" 401
http GET "$BASE/v1/agent/analyses" -H "$(AUTH "$TOKEN")";   check "list with agent token" 200
http GET "$BASE/v1/agent/analyses/does-not-exist" -H "$(AUTH "$TOKEN")"; check "unknown id is 404" 404
http POST "$BASE/v1/agent/analyses/does-not-exist/run" -H "$(AUTH "$TOKEN")"; check "run on unknown id is 404" 404

# ---- 2. photo lifecycle -----------------------------------------------------
say ""; say "== 2 photo"
if [ -f "$JPEG" ]; then
  http POST "$BASE/v1/agent/analyses" -H "$(AUTH "$TOKEN")" -F "file=@$JPEG;type=image/jpeg"
  check "photo upload is 201" 201; PHOTO="$(field .analysis.analysisId)"; CREATED="$CREATED $PHOTO"
  [ "$(field .analysis.status)" = "uploaded" ] && say "      status uploaded" || { FAILS=$((FAILS+1)); say "FAIL  photo initial status not uploaded"; }
  http POST "$BASE/v1/agent/analyses" -H "$(AUTH "$TOKEN")" -F "file=@$0;type=image/jpeg"
  check "non-JPEG bytes rejected" 400
  http POST "$BASE/v1/agent/analyses" -H "$(AUTH "$TOKEN")" -F "file=@$JPEG;type=image/png"
  check "declared png rejected" 415 400
  http GET "$BASE/v1/agent/analyses/$PHOTO/source" -H "$(AUTH "$TOKEN")" ; check "photo source readable" 200
  cmp -s "$BODY" "$JPEG" && say "      source bytes identical" || { FAILS=$((FAILS+1)); say "FAIL  photo source bytes differ"; }
  if [ -z "${AISHOP_SKIP_PROVIDER:-}" ]; then
    http POST "$BASE/v1/agent/analyses/$PHOTO/run" -H "$(AUTH "$TOKEN")"; check "photo run accepted" 200 201 202
    poll "$PHOTO" "$TOKEN"; [ "$(field .analysis.status)" = "analyzed" ] && check "photo analysed" 200 || { FAILS=$((FAILS+1)); say "FAIL  photo did not reach analyzed: $(field .analysis.failureReason)"; }
    http POST "$BASE/v1/agent/analyses/$PHOTO/run" -H "$(AUTH "$TOKEN")"; check "refine without context is 400" 400
    http POST "$BASE/v1/agent/analyses/$PHOTO/run" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data '{"context":"Count only front-facing units."}'
    check "refine with context accepted" 200 201 202
  else skip "photo run/refine" "AISHOP_SKIP_PROVIDER"; fi
else skip "photo" "no JPEG at $JPEG"; fi

# ---- 3. video reservation and its negatives --------------------------------
say ""; say "== 3 video reservation"
if [ -n "$VIDEO" ] && [ -f "$VIDEO" ]; then
  BYTES="$(stat -f%z "$VIDEO" 2>/dev/null || stat -c%s "$VIDEO")"; NAME="$(basename "$VIDEO")"
  reserve() { jq -n --arg n "$1" --arg m "$2" --argjson b "$3" '{fileName:$n,mediaType:$m,byteLength:$b}' |
    curl -sS -o "$BODY" -w '%{http_code}' "$BASE/v1/agent/video-uploads" -H "$(AUTH "$TOKEN")" -H "Origin: $ORIGIN" -H 'Content-Type: application/json' --data-binary @- 2>>"$LOG"; }
  BODY="$WORK/r1"; STATUS="$(reserve "$NAME" video/mp4 "$BYTES")"; check "reserve video is 201" 201
  VID="$(field .analysis.analysisId)"; UPLOAD="$(field .upload.uri)"; CREATED="$CREATED $VID"
  say "      reserved $VID ($BYTES bytes; upload uri held, not shown)"
  BODY="$WORK/r2"; STATUS="$(reserve "$NAME" application/pdf "$BYTES")"; check "pdf media type is 415" 415
  BODY="$WORK/r3"; STATUS="$(reserve "$NAME" video/mp4 300000000)"; check "over-size is 413" 413
  BODY="$WORK/r4"; STATUS="$(reserve "../$NAME" video/mp4 "$BYTES")"; check "path in fileName is 400" 400
  BODY="$WORK/r5"; STATUS="$(jq -n --arg n "$NAME" --argjson b "$BYTES" '{fileName:$n,mediaType:"video/mp4",byteLength:$b}' |
    curl -sS -o "$BODY" -w '%{http_code}' "$BASE/v1/agent/video-uploads" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data-binary @- 2>>"$LOG")"
  check "missing Origin is 400 (documented; see review note 4)" 400

  # ---- 4. the Storage leg — THE diagnostic ---------------------------------
  say ""; say "== 4 storage transfer (direct to Storage, no Firebase auth)"
  http PUT "$UPLOAD" -H "Content-Range: bytes */$BYTES" --data-binary ''
  check "fresh session inspect is 308 (0 bytes)" 308
  http PUT "$UPLOAD" -H "Content-Type: video/mp4" -H "Content-Range: bytes 0-$((BYTES-1))/$BYTES" --data-binary "@$VIDEO"
  check "whole-file PUT accepted" 200 201
  [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ] || say "      STORAGE BODY: $(head -c 400 "$BODY" | tr '\n' ' ')"
  http PUT "$UPLOAD" -H "Content-Range: bytes */$BYTES" --data-binary ''
  check "inspect after full PUT is complete" 200 201

  # ---- 5. completion, processing, analysis -------------------------------
  say ""; say "== 5 complete and process"
  if [ -z "${AISHOP_SKIP_PROVIDER:-}" ]; then
    http POST "$BASE/v1/agent/video-uploads/$VID/complete" -H "$(AUTH "$TOKEN")"; check "complete accepted" 200
    [ "$(field .analysis.status)" = "processing" ] && say "      status processing" || say "      status after complete: $(field .analysis.status)"
    http POST "$BASE/v1/agent/video-uploads/$VID/complete" -H "$(AUTH "$TOKEN")"; check "second complete is idempotent or 409" 200 409
    poll "$VID" "$TOKEN"
    [ "$(field .analysis.status)" = "analyzed" ] && check "video analysed" 200 || { FAILS=$((FAILS+1)); say "FAIL  video ended $(field .analysis.status): $(field .analysis.failureReason)"; }
    say "      frames: $(jq -r '.analysis.frames|length' "$BODY")  runs: $(jq -r '.analysis.runs|length' "$BODY")  products: $(jq -r '.analysis.report.identifiedProducts|length' "$BODY" 2>/dev/null)"
    http POST "$BASE/v1/agent/analyses/$VID/run" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data '{"context":"Recount the top shelf only."}'
    check "video refine passes the attempt fence (regression from fail-closed fence)" 200 201 202
  else skip "complete/process/refine" "AISHOP_SKIP_PROVIDER"; fi

  # ---- 6. recovery on a second disposable reservation ---------------------
  say ""; say "== 6 cancel, renew, restart"
  BODY="$WORK/r6"; STATUS="$(reserve "$NAME" video/mp4 "$BYTES")"; check "reserve disposable" 201
  DISP="$(field .analysis.analysisId)"; CREATED="$CREATED $DISP"
  http POST "$BASE/v1/agent/video-uploads/$DISP/session" -H "$(AUTH "$TOKEN")" -H "Origin: $ORIGIN"; check "renew while uploading is 201" 201
  http GET "$BASE/v1/agent/analyses/$DISP" -H "$(AUTH "$TOKEN")"; V="$(field .analysis.version)"
  http POST "$BASE/v1/agent/analyses/$DISP/cancel" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data "{\"version\":$V}"
  check "cancel while uploading" 200; say "      outcome: $(field .outcome 2>/dev/null) status: $(field .analysis.status 2>/dev/null)"
  http POST "$BASE/v1/agent/analyses/$DISP/cancel" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data "{\"version\":$V}"
  check "cancel again is idempotent-or-changed (200/409)" 200 409
  http POST "$BASE/v1/agent/video-uploads/$DISP/session" -H "$(AUTH "$TOKEN")" -H "Origin: $ORIGIN"; check "renew after cancel refused" 409 400
  http POST "$BASE/v1/agent/analyses/$DISP/restart" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data '{"version":0}'
  check "restart with no evidence refused" 409 400
  if [ -n "${VID:-}" ] && [ -z "${AISHOP_SKIP_PROVIDER:-}" ]; then
    http GET "$BASE/v1/agent/analyses/$VID" -H "$(AUTH "$TOKEN")"; V="$(field .analysis.version)"
    http POST "$BASE/v1/agent/analyses/$VID/cancel" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data "{\"version\":$V}"
    check "cancel a settled analysis reports already-settled (200 with reason)" 200 409
  fi
else skip "video sections 3–6" "set AISHOP_VIDEO to an .mp4"; fi

# ---- 7. admin reads ---------------------------------------------------------
say ""; say "== 7 admin"
if [ -n "$ADMIN" ]; then
  http GET "$BASE/v1/admin/analyses" -H "$(AUTH "$ADMIN")"; check "admin list" 200
  http GET "$BASE/v1/admin/analyses" -H "$(AUTH "$TOKEN")"; check "agent token on admin route is 403" 403
  http GET "$BASE/v1/admin/analyses?limit=abc" -H "$(AUTH "$ADMIN")"; check "bad filter is 400" 400
  http POST "$BASE/v1/admin/analyses" -H "$(AUTH "$ADMIN")"; check "admin write is 405" 405
else skip "admin" "set AISHOP_ADMIN_EMAIL/PASSWORD"; fi

# ---- 8. owner isolation -----------------------------------------------------
say ""; say "== 8 isolation"
if [ -n "$OTHER" ] && [ -n "${PHOTO:-}" ]; then
  http GET "$BASE/v1/agent/analyses/$PHOTO" -H "$(AUTH "$OTHER")"; check "other owner cannot read detail" 404
  http GET "$BASE/v1/agent/analyses/$PHOTO/source" -H "$(AUTH "$OTHER")"; check "other owner cannot read source" 404
  http POST "$BASE/v1/agent/analyses/$PHOTO/run" -H "$(AUTH "$OTHER")"; check "other owner cannot run" 404
  http POST "$BASE/v1/agent/analyses/$PHOTO/cancel" -H "$(AUTH "$OTHER")" -H 'Content-Type: application/json' --data '{"version":1}'; check "other owner cannot cancel" 404
else skip "isolation" "set AISHOP_OTHER_EMAIL/PASSWORD"; fi

# ---- 9. tidy up and summary -------------------------------------------------
say ""; say "== 9 cleanup"
for id in $CREATED; do
  http GET "$BASE/v1/agent/analyses/$id" -H "$(AUTH "$TOKEN")"; st="$(field .analysis.status)"; V="$(field .analysis.version)"
  case "$st" in uploading|uploaded|processing|analyzing)
    http POST "$BASE/v1/agent/analyses/$id/cancel" -H "$(AUTH "$TOKEN")" -H 'Content-Type: application/json' --data "{\"version\":$V}"
    say "      cancelled $id (was $st) -> $STATUS";; esac
done
rm -rf "$WORK"
say ""; say "===== $PASSES passed, $FAILS failed, $SKIPS skipped  ($LOG)"
[ "$FAILS" -eq 0 ]
