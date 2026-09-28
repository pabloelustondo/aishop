# QA-000 — Case title

Status: PROPOSED. Replace every placeholder before review.

## Fixture

- File: `../fixtures/QA-000-short-name.jpeg`
- SHA-256: `<hash>`
- Source: `<trusted contributor or owned test asset>`
- Retention permission confirmed: `<yes/no and date>`

## Purpose

State the defect, boundary, or representative behavior this case protects.

## Input

- Analysis mode: `<areaScan or targetProduct>`
- User instruction or target: `<exact value or none>`
- Required for promotion: `<yes/no>`

## Steps

1. Sign in to the deployed TEST Agent page.
2. Upload the fixture using the specified mode and input.
3. Observe `analyzing`; refresh once without starting another run.
4. Wait for a terminal state and inspect My Runs and All Runs.

## Expected result

- Terminal state: `<analyzed or an intentional failure>`
- Human-visible findings: `<evidence-bounded expectation>`
- Regression checks: `<no duplicate, preserved image, diagnostics, or other>`

Record actual results only in a dated file under `../runs/`.
