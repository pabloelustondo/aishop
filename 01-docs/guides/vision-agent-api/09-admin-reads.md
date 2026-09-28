# Admin endpoint tests

Prerequisite: ADMIN_TOKEN from an account with literal admin:true.
Agent authorization alone is insufficient. All implemented Admin routes are reads.
There is no implemented stale-upload preview or bulk cancellation endpoint.

## List and filters

```sh
PAGE=$(curl -sS --fail-with-body --get "$BASE/v1/admin/analyses"   -H "Authorization: Bearer $ADMIN_TOKEN"   --data-urlencode 'limit=25' --data-urlencode 'status=uploading')
printf '%s' "$PAGE" | jq '{analyses,nextCursor}'
```

Expected 200 with analyses, ownerKey/owner labels and nextCursor.
Filters: owner (64-character hash), status, from, to, cursor, limit.
Dates are YYYY-MM-DD UTC; to includes that full day. Default limit 25; maximum 50.
Current status filter accepts uploading/processing/uploaded/analyzing/analyzed/failed.
Cancelled filtering is not yet accepted, though unfiltered reads may return it.
Bad filters: 400 filter_invalid; bad cursor: 400 cursor_invalid.
Missing required Firestore index: 503 index_unavailable.

## Next page

```sh
CURSOR=$(printf '%s' "$PAGE" | jq -r '.nextCursor // empty')
curl -sS --get "$BASE/v1/admin/analyses"   -H "Authorization: Bearer $ADMIN_TOKEN"   --data-urlencode 'limit=25' --data-urlencode 'status=uploading'   --data-urlencode "cursor=$CURSOR"
```

Run only when CURSOR is nonempty; preserve filters across pages.

## Detail and original source

Choose OWNER_KEY and ADMIN_ID from a returned row; do not guess them.
```sh
OWNER_KEY='REPLACE_WITH_OWNER_KEY'
ADMIN_ID='REPLACE_WITH_ANALYSIS_ID'
curl -i "$BASE/v1/admin/analyses/$OWNER_KEY/$ADMIN_ID" -H "Authorization: Bearer $ADMIN_TOKEN"
ADMIN_QA=$(mktemp -d)
curl -fS "$BASE/v1/admin/analyses/$OWNER_KEY/$ADMIN_ID/source"   -H "Authorization: Bearer $ADMIN_TOKEN" --output "$ADMIN_QA/source"
```

Expected 200 on an existing record/source; invalid/missing pair: 404.
Use Agent-only token on all three routes: 403. No token: 401.
POST to the list, DELETE to detail, PUT to source: 405; /run under Admin: 404.
Store downloaded evidence securely; owner labels are private data.
