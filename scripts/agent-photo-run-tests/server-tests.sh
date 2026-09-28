#!/usr/bin/env bash
# Run from the repository root; no env file or live provider key is loaded.
set -euo pipefail
node --test server/test/*.test.js
