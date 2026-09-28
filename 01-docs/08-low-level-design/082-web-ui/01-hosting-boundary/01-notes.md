# 01 — Browser and server boundary

[`firebase.json`](../../../../firebase.json) names `02-web-ui/` as Hosting's public root.
There is no browser bundling step: the deployed files match the repository files.
HTML, CSS, and JavaScript receive `Cache-Control: no-cache`.
The current Hosting ignore list does not exclude repository Markdown.

The page loads Firebase App, Firebase Auth, and the generated Firebase initialization script.
Those scripts establish the signed-in browser session.
The page-specific JavaScript retrieves an ID token before protected API requests.

Hosting rewrites Agent, administrator, inspection, and VISTA routes to `api`.
The browser can therefore call relative `/v1/...` paths on the same origin.
The API still verifies every token and role; a hidden link is not authorization.

Direct video bytes are the important exception.
After reservation, the browser uploads them to a temporary Cloud Storage session URI.
That URI is a capability and does not receive the Firebase bearer token.

The server source, Firestore, Cloud Storage verification, tasks, and OpenAI are outside this folder.
