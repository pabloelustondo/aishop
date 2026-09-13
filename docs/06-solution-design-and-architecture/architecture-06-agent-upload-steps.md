# AI Shop Agent — Upload, Step by Step

Companion to [architecture-04](architecture-04-agent-upload-path.md).

## 0 — The page loads

Firebase Hosting serves a static page. Its script signs in, then fetches
the existing analyses, so the page opens showing history rather than an
empty box.

| File | Responsibility |
| --- | --- |
| `dashboard/agent.html` | upload field, submit button, list |
| `dashboard/scripts/agent.js` | sign-in, submit, rendering the rows |

## 1 — A photograph is chosen and submitted

The script builds a `multipart/form-data` body with exactly one file
part and sends it with the Firebase ID token. The file picker filters
for JPEG, but that filter is a courtesy to the person, not a check: the
server assumes the browser may be lying.

## 2 — The server takes the image and stores it

Five files in order. The request is authenticated, the bytes are read
and checked, and only then is anything written. Rejection precedes
storage, so a junk file costs nothing but bandwidth.

Note the order inside the store: **bytes first, record second**. If the
write of the bytes fails there is no record pointing at nothing.

| File | Responsibility |
| --- | --- |
| `firebase-api-router.js` | sends `/v1/agent` to the agent handler |
| `agent-api-handler.js` | verifies the token, derives `ownerKey = sha256(uid)` |
| `agent-upload-request.js` | one file part; JPEG by its bytes; <= 5 MiB; <= 4096 px |
| `agent-evidence-store.js` | writes the bytes once, create-only, private |
| `agent-analysis-store.js` | creates the record as `uploaded`. Never the bytes. |

## 3 — The caller is told it was saved

`201` with the analysis identifier and the status `uploaded`. The
acknowledgement is deliberately narrow and true: the bytes are durable
and nobody has looked at them yet.
