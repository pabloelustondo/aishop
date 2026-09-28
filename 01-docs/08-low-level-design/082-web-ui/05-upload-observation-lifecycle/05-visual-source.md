# 05 — Upload lifecycle visual specification

## Diagram type
Activity diagram with photograph and video branches.

## Shared start
Select file, validate media type, disable controls, and show progress.

## Photograph branch
Create analysis, request first run, refresh durable state.

## Video branch
Reserve record, transfer chunks, confirm completion, refresh durable state.
Add a recovery branch for interrupted transfer and rejected sessions.

## Observation loop
Render record, check active status, wait 15 seconds, and GET again.
Exit on analyzed, failed, cancelled, hidden page, or observation ceiling.

Use a browser boundary around upload and polling actions.
Place Storage and the Agent API outside that boundary.
