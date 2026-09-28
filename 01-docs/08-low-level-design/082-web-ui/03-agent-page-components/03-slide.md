# Vision Agent Client Structure

- `agent.html` declares authentication, upload, progress, and results regions.
- `agent.js` coordinates identity, requests, transfer, polling, and rendering.
- `agent.css` owns the page layout and analysis-card presentation.
- `base.css` supplies shared typography and controls.
- Firebase Auth supplies the current user and ID token.
- The Agent API receives authenticated analysis requests from `agent.js`.

`agent.js` sits between the visible page and the external services it uses.
