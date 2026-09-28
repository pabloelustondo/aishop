# 03 — Vision Agent client components

[`02-web-ui/agent.html`](../../../../02-web-ui/agent.html) contains four major regions.
The header exposes activity, navigation, refresh, and sign-out controls.
The signed-out card supports email/password and Google authentication.
The upload form accepts JPEG, MP4, and QuickTime evidence.
The main region holds transfer progress, analysis cards, and the empty state.

[`02-web-ui/scripts/agent.js`](../../../../02-web-ui/scripts/agent.js) binds those elements.
`start()` registers events and reacts to Firebase authentication changes.
`authorized()` adds the current Firebase ID token to protected requests.
`refresh()` reads the analysis list and schedules observation when work is active.
`card()` and its helper functions render evidence, findings, history, and actions.
The video functions reserve sessions, transfer chunks, inspect progress, and recover.

[`02-web-ui/styles/agent.css`](../../../../02-web-ui/styles/agent.css) is intentionally page-specific.
It avoids the reviewer page's generic two-column `main` selector.
`allruns.html` loads Agent styling because both pages render the same record shape.

At 1,111 lines, `agent.js` contains several future module boundaries.
This presentation documents current responsibilities before proposing refactoring.
