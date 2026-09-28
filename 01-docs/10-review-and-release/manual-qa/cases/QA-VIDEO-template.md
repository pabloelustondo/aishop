# QA-VIDEO — Case title

Status: PROPOSED. Replace every placeholder before review.

## Fixture

- File: `../fixtures/QA-NNN-short-name.mov`
- SHA-256: `<hash>`
- Source and retention permission: `<non-sensitive description and date>`
- Safe technical facts: `<container, codec, bytes, duration, dimensions>`

## Purpose and input

- Regression protected: `<upload, resume, extraction, analysis, refresh, playback>`
- Required for promotion: `<yes/no>`

## Steps

1. Sign in to the deployed TEST Agent page and select the video.
2. Start upload once; confirm the upload control is disabled during transfer.
3. Observe `processing`, then `analyzing`; refresh once without starting another run.
4. Wait for a terminal state and inspect My Runs, All Runs and source playback.

## Expected result

- One analysis and one provider run; no duplicate after refresh or task replay.
- Original private video plays; sampled-frame count and duration are visible.
- Terminal state and evidence-bounded findings: `<expected>`.

Record actual results only in a dated file under `../runs/`.
