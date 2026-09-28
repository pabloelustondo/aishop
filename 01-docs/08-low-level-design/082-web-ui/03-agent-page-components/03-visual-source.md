# 03 — Component visual specification

## Diagram type
Layered client diagram centered on `agent.js`.

## Visible page
- Authentication card
- Upload composer
- Transfer progress
- Analysis list and cards

## Controller layer
Place `agent.js` between the visible page and external services.
Show page events moving into it and rendering returning to the page.

## Dependencies
- CSS styles the page without joining the request flow.
- Firebase Auth supplies identity and tokens to `agent.js`.
- `agent.js` sends authenticated requests to the Agent API.
