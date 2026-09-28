# Browser and Server Boundary

- Firebase Hosting publishes the static `02-web-ui/` directory.
- HTML loads page-specific CSS and JavaScript modules.
- Firebase SDK scripts provide browser authentication.
- Same-origin `/v1/...` requests are rewritten to the `api` function.
- Server code owns authorization, evidence, durable state, and AI processing.
