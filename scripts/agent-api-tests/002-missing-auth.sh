#!/usr/bin/env bash
# Expected: HTTP 401 unauthorized.
curl -i --connect-timeout 10 --max-time 30 \
  'https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api/v1/agent/analyses'
