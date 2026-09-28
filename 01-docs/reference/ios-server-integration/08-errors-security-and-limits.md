# Errors, Security, and Limits

HumanReviewerInitials: PME

## Client-visible failures

| Status | Meaning |
| --- | --- |
| `400` | Invalid JSON, exact-field contract, coordinates, Base64, MIME type, or JPEG structure |
| `401` | Missing, malformed, expired, or unverifiable Firebase bearer token |
| `404` | Unknown route/record or a record hidden by ownership policy |
| `413` | Encoded body or decoded JPEG exceeds the configured limit |
| `415` | Request is not `application/json` |
| `502` | OpenAI request, timeout, or response validation failed |
| `503` | Evidence or Firestore persistence failed |
| `500` | Unexpected server failure |

The server returns JSON `{ "error": "safe message" }`, `Cache-Control: no-store`, and does not expose provider or internal exception details. The iOS app separates transport, invalid-response, configuration, and server-message failures.

## JPEG enforcement

- Maximum decoded size is 5 MiB; maximum request size allows Base64 expansion plus 4 KiB JSON overhead.
- Base64 must be canonical and complete.
- JPEG parsing requires SOI, a valid nonzero frame, a valid scan header, entropy bytes, and EOI with no unrelated trailing bytes.
- Up to four concatenated valid JPEG images are structurally accepted; a new client should send exactly one image.

## Security invariants

- TLS only; reject placeholder or non-HTTPS base URLs.
- Derive ownership only from verified Firebase `uid`.
- Never log passwords, ID tokens, image Base64, OpenAI keys, or Firebase credentials.
- Never expose Storage objects publicly; evidence responses use `private, no-store`.
- Keep model keys server-side and set `store: false` on OpenAI requests.
- Use non-overwriting Storage and Firestore creation semantics.
- Return `404` for unauthorized ownership reads to avoid confirming another customer's scan.

## Operational cautions

Base64 JSON holds multiple in-memory copies of the image. Normalize large captures client-side and monitor latency, function memory, OpenAI cost, Storage growth, and Firestore retention before scaling beyond the POC.
