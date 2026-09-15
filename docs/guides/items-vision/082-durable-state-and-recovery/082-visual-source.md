# 082 - Visual Source

## Core message
Server-side state survives client refresh. Version and attempt checks
prevent cancelled or older video work from replacing a newer result.

## Composition
Use a 1600 by 900 canvas in the deck palette.
Show one state rail across the top half.
Show recovery operations beneath it, aligned to the state where they apply.
Use a small separate fence illustration for late work.

## State rail
Normal path: uploading, processing, uploaded (brief), analyzing, analyzed.
Failed and cancelled branch from active work as recorded terminal outcomes.
Do not collapse uploading and processing into the same recovery condition.

## Recovery
Session renewal is available only during uploading.
Cancel checks the latest version and retains history/evidence.
Restart is for an eligible cancelled video with complete source evidence.
It creates a new attempt and re-extracts frames.
Fresh record creation is needed when bytes never completed.

## Fence
Show old attempt A being rejected by a newer attempt B.
Labels must explain `version`, `attemptId`, and `runId` rather than decorate.

## Known limits
The reconciler does not sweep stalled transfers or all processing states.
Video `/run` attempt propagation and source download have recorded gaps.
Put these in speaker notes and a concise slide caveat.

## Source
`docs/guides/vision-agent-api/08-recovery.md`, `11-limits-and-gaps.md`,
`12-architecture-implementation.md`, and `server/src/agent-analysis-store.js`.

## Output
Generate `082-visual.svg` with editable SVG labels.
Attach the full `082-notes.md` to the image slide in the PPTX.
