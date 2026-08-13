# HTTP API Contracts

HumanReviewerInitials: PME

## Endpoint

Production base URL: `https://northamerica-northeast2-aishop-99d36.cloudfunctions.net/api`

Submit with `POST /inspections`, `Content-Type: application/json`, and a Firebase bearer token. A direct browser GET correctly returns `401 Unauthorized` because it has no token.

## Exact submission body

```json
{
  "imageBase64": "<canonical Base64 JPEG>",
  "mediaType": "image/jpeg",
  "mode": "targetProduct",
  "appVersion": "1.2 (3)",
  "targetPosition": { "x": 0.5, "y": 0.5 }
}
```

The server rejects missing or extra keys. For `areaScan`, set `targetPosition` to JSON `null`. Coordinates must be finite numbers between 0 and 1. `appVersion` must be trimmed, nonempty, and at most 64 characters.

## Success response

Status `201`:

```json
{
  "scanId": "<UUID>",
  "mode": "targetProduct",
  "report": { "productName": "...", "summary": "..." }
}
```

The iOS decoder requires the response `mode` to match the requested mode. Target reports include `productName`, `summary`, `visibleEvidence`, `missingInformation`, `conclusion`, `conclusionReason`, and `confidence`. Area reports include `summary`, `identifiedProducts`, and `uncertainItems`.

## Related reads

- `GET /inspections/{scanId}`: owner or claimed reviewer; returns `404` when absent or not visible.
- `GET /inspections`: reviewer claim required; returns pending and recent queues.
- `GET /inspections/{scanId}/evidence`: reviewer claim required; returns private JPEG bytes.
- `GET /health`: unauthenticated deployment health check.

Do not use the retired `/analyze-product` static-token endpoint for new integrations.
