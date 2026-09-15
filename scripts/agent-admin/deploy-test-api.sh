#!/usr/bin/env bash
# Deploy API only to TEST. Run only with Pablo's deployment authorization.
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || exit 1
firebase deploy --only functions:api --project aishop-99d36 --non-interactive
