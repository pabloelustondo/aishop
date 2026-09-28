# Google Vids narration pilot

Three-scene derivative of the original walkthrough, for reviewing voice and pacing.
Source slides: 1 (title), 5 (architecture), and 6 (pipeline orchestration).
The slide visuals and their original page numbers remain unchanged.
The full presentation and its original speaker notes remain unchanged.

## Narration

- [Title](01-title.md)
- [Architecture](02-architecture.md)
- [Pipeline orchestration](03-orchestration.md)

These plain-text scripts omit code links and spell out selected terms for speech.
Each script stays below 50 physical lines and Google Vids' 800-character scene limit.
The pilot is a format experiment, not new implementation or acceptance evidence.

## Build

Run `tools/build-vids-pilot.mjs` with the bundled Node runtime.
The builder selects the existing editable slides and embeds these scripts as notes.
It writes a separate PPTX under `artifacts/`; previews stay in `.build/`.

## Playback

Use the original [clickable walkthrough](../code-walkthrough.md) on a second monitor.
- [Watch the narrated pilot](https://docs.google.com/videos/d/1bbVyjlszxhwRFHRiv8y22y9G1c-E_XA5FhwnY--52SA/edit)
- [Editable Google Slides with matching narration notes](https://docs.google.com/presentation/d/1S8IhMEhn_1CqVDpSIetpeYzGboOA4HhDlR0H73RzCDI/edit)
- [Current pilot PPTX](../artifacts/Sprint-001-Google-Vids-Pilot-r02.pptx)

Verified on 20 September 2026: three voiceover tracks, total duration 2:06.5.
Voice: Narrator (smooth, medium pitch); no avatar, automatic animation, or music.
All three scene layouts and playback progression were checked in Google Vids.
Listening review of pronunciation and pacing remains for Pablo.
Revision 01 predates the scene-length adjustment; revision 02 matches these scripts.
The private Slides and Vids files are stored in the walkthrough's Google Drive folder.
