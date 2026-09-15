#!/usr/bin/env bash
# CHANGES TEST permissions: Agent only; preserves other claims.
node "$(dirname "${BASH_SOURCE[0]}")/../../server/scripts/agent-access.mjs" \
  grant 'pablo@elustondo.ai' --project aishop-99d36 --role agent
