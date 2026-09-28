# Server Processing and Persistence

HumanReviewerInitials: PME

## Submission pipeline

1. The Firebase Function routes `/inspections` to the inspection API.
2. The handler requires `Bearer`, verifies it with Firebase Admin, and derives `ownerId` from `uid`.
3. The body reader enforces the maximum encoded request size and parses JSON.
4. Submission validation enforces the exact fields, mode, coordinates, version, MIME type, Base64, byte limit, and JPEG structure.
5. A UUID `scanId` is generated server-side.
6. The decoded JPEG is written to Cloud Storage before model analysis.
7. The inspection adapter sends the image and mode instruction to the OpenAI Responses API.
8. Model output must satisfy the strict mode-specific JSON schema and server validation.
9. Firestore creates the inspection record; the HTTP response returns the report.

## Evidence storage

- Object path: `inspections/{scanId}/original.jpg`.
- Upload uses `ifGenerationMatch: 0`, preventing overwrite.
- Metadata includes `image/jpeg`, `private, no-store`, decoded byte length, and SHA-256.
- The server stores the exact decoded bytes received; it does not resize or recompress them.

## AI request

- Endpoint: OpenAI `POST /v1/responses`.
- Image input: `data:image/jpeg;base64,<imageBase64>` with detail `auto`.
- `store: false`, maximum 1,200 output tokens, default model `gpt-5.4-mini`.
- Target mode instructs the model to prioritize normalized `(x,y)` and use surroundings only as context.
- Area mode requests up to 12 visibly supported products and separates uncertain items.
- A strict JSON Schema prevents additional response properties.

## Firestore record

The `inspections/{scanId}` document contains `scanId`, trusted `ownerId`, mode, app version, target position, evidence metadata, status, initial findings or failure, server timestamp, and review count. Creation uses Firestore `create`, so an existing scan cannot be overwritten.

Provider failure creates a `failed` record with null findings and a stable failure code. Successful analysis creates `pending` status for human review.
