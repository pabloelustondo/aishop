# 08 - Vision Agent API Contract

This slide opens the Low-Level Design and Architecture section.
It describes the newer web Vision Agent's public contract, not every AI Shop API.
The earlier AI Shop iPhone endpoint and VISTA package-ingest route are distinct.

## Access and identity
The application supplies a Firebase ID token on Agent requests.
The server requires the literal `agent: true` custom claim.
It verifies the token and hashes the UID to derive an owner key.
The caller cannot supply another owner's key for Agent operations.
Admin cross-user reads require the independent `admin: true` claim.
Neither app client holds the OpenAI credential or Firebase Admin credentials.

## Photograph contract
`POST /v1/agent/analyses` receives multipart form data containing one JPEG field `file`.
It creates an uploaded analysis record, returning its analysis ID.
An optional `run=true` form field can initiate the first analysis after upload.
Alternatively, the client calls `POST /v1/agent/analyses/{id}/run`.
Refining an analyzed photograph requires a meaningful context note.
The initial run and refinement return a current record, not necessarily a final report.

## Video contract
`POST /v1/agent/video-uploads` reserves a record using filename, media type,
byte length, and the allowed browser Origin.
Its response includes a temporary Storage session URI.
The client uploads bytes directly to that URI without the Firebase bearer token.
The URI itself grants upload capability and must not be logged or shared.
A 308 Storage response means resumable progress, not a redirect.
After Storage confirms completion, `POST /{id}/complete` verifies the object
and begins server-side processing. A processing response is not an AI result.

## Reading and errors
`GET /v1/agent/analyses/{id}` returns the durable status and eventual report.
The same ID links source evidence, runs, diagnostics and saved findings.
GET calls observe work; they do not start model processing.
The Agent list is owner-scoped; the Admin list is cross-user and paginated.
The source route is intended to return original bytes, but the September 15
video test returned HTTP 500 with an empty body. Do not claim playback works.
API errors normally include code, message, retryable and requestId.
HTTP 200 on a mutable route still requires inspection of its outcome and state.

## Sources
- `docs/guides/vision-agent-api/02-endpoints.md`
- `docs/guides/vision-agent-api/03-authentication.md`
- `docs/guides/vision-agent-api/07-images-and-runs.md`
- `docs/guides/vision-agent-api/developer-guide.md` (draft, September 15 tests)
- `server/src/agent-api-handler.js`
