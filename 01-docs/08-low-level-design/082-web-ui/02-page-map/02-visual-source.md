# 02 — Page map visual specification

## Diagram type
Application family map rooted at `02-web-ui/`.

## Branches
- Vision Agent: `agent.html` plus `agent.js` and `agent.css`.
- Admin All Runs: `allruns.html` plus `allruns.js` and `allruns.css`.
- Inspection Review: `index.html` plus `app.js`, `api.js`, and `view.js`.
- Catalog Browser: `catalog.html`, `catalog.js`, JSON, and images.

## Shared elements
Place `base.css` and Firebase Hosting beneath the four branches.
Show Firebase Auth under the three authenticated applications.

## Relationship
Give all four applications the same fill, border, size, and connector weight.
They are peer pages within the same Hosting root.
The presentation focus does not imply a runtime hierarchy among them.
