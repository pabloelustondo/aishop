#!/usr/bin/env bash
# Read-only current account claims (step 007 and verification after step 008).
node "$(dirname "${BASH_SOURCE[0]}")/../../server/scripts/agent-access.mjs" \
  show 'pablo@elustondo.ai' --project aishop-99d36
