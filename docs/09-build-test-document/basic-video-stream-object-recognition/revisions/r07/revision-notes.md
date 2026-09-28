# Revision 04

20 September 2026. Replaces the 15-slide overview as the current walkthrough.
The earlier deck, source folders, and three-slide narration pilot are preserved.
This is build/test documentation, not a new design or an implementation change.

## What changed

- Expanded to 30 slides across four independently watchable subjects.
- Added frame and episode contracts, event ordering, concurrency, and failure boundaries.
- Explained frozen rules and their reasons, log replay, and retained-image limits.
- Added measured results, explicit review concerns, and the physical-iPhone runbook.
- Added a complete changed-file map and implementation fingerprint snapshot.
- Retained top-to-bottom diagrams and at most three clickable references per visual.
- Narration and written notes now derive from one maintained content module.
- Applied the agreed five-minute target and ten-minute maximum to this collection.

## Evidence and limits

- Fresh Mac gate: 29 tests, no failures or skips, all required checks present.
- First sandboxed attempt failed before tests because Swift's module cache was blocked.
- The authorized retry used normal compiler cache access and passed.
- [Fresh test transcript](artifacts/evidence/mac-gate-r04.log)
- [Required-test summary](artifacts/evidence/test-summary-r04.json)
- Earlier Simulator snapshot: 25 app tests passed; not rerun for this revision.
- [Earlier measured fixture evidence](../../artifacts/evidence/README.md) supplies slide 24.
- Comparator CLI rehearsed with explicitly synthetic phone labels, not device evidence.
- Physical-iPhone demonstration and exported-log comparison remain pending.

## Review status

The presentation and walkthrough governance packages remain uncommitted proposals.
Their shared form guided this revision; this work does not approve those packages.
The video-duration convention is applied here, not silently added to governance.
Nothing is staged or committed. Application source and test source remain untouched.
