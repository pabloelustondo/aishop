#!/usr/bin/env bash
# Read-only deployed function state; exclude environment variables and secrets.
gcloud functions describe api --gen2 --region northamerica-northeast2 \
  --project aishop-99d36 --format='json(state,updateTime,serviceConfig.revision)'
