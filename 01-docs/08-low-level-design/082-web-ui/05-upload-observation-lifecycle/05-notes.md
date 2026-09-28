# 05 — Upload and observation lifecycle

The upload form gives one file to `upload()`.
JPEG handling posts multipart form data to `/v1/agent/analyses`.
After creation, the client can start the first analysis through `/run`.

Video handling uses a longer client-orchestrated sequence.
`uploadVideo()` reserves an uploading record and receives a Storage session URI.
`uploadVideoChunks()` sends bounded chunks and reports browser-visible progress.
The Storage URI is used without the Firebase bearer token.
After Storage accepts all bytes, the client calls the API's `/complete` operation.

Interrupted transfers can leave an uploading record and a held local session.
Recovery logic inspects the session, renews only eligible sessions, and limits attempts.
The UI can offer Resume upload, Cancel upload, or Start fresh.
Local storage remembers transfer capability only for the matching local file identity.

`refresh()` reads durable analyses and renders their current state.
`scheduleObservation()` polls every 15 seconds while a record remains active.
Polling stops when the page is hidden, the work settles, or ten minutes pass.
Refresh observes server work; it does not itself execute recognition.

Implementation: [`02-web-ui/scripts/agent.js`](../../../../02-web-ui/scripts/agent.js).
