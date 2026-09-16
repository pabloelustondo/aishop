# Test 010 — Authorized Admin list

Result: PASS — operator-supplied HTTP 200 with 13 analyses on this page.
Environment: TEST, project `aishop-99d36`.

## Purpose and command

Verify the new token is accepted by the Admin list endpoint, independently
of the successful Agent list and local token-role inspection.
Unlike the Agent list, this route can return analyses across users.

```bash
source scripts/agent-api-tests/010-admin-list.sh
```

Use the same Bash session as sign-in. This is a read-only request.
The script prints only HTTP status, array presence, page count and error.
It does not print owner identities, filenames, tokens or report contents.

## Expected result

HTTP 200, hasAnalyses true, error null. Zero records is valid.
analysisCount is the current page size (up to 25), not the total database count.
401 means token rejection; 403 means missing Admin authorization.
503 index_unavailable indicates a required index is unavailable.

## Observed result

Pablo sourced the saved script in the authenticated Bash session and supplied:

```json
{
  "httpStatus": 200,
  "hasAnalyses": true,
  "analysisCount": 13,
  "error": null
}
```

The Admin list accepted the token and returned an array with 13 records.
No private record contents were included in this evidence.
Exact response time and deployed revision were not captured.

## Boundaries

This does not test uploads, processing, pagination,
filters, individual record reads or isolation against non-admin accounts.
