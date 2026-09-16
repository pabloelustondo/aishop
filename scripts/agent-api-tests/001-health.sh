#!/usr/bin/env bash
# Expected: HTTP 200 and {"status":"ok"}.
curl -i --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/health'
