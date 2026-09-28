# Manual QA Library

## Purpose

Keep a small, repeatable set of real photographs and expected outcomes for
manual smoke testing and regression before a sprint branch is promoted.

## Structure

- `fixtures/` contains unchanged test JPEGs and videos received from trusted contributors.
- `cases/` contains one numbered specification for each fixture or scenario.
- `runs/` contains dated execution records copied from its template.

## Adding a case

1. Confirm the photograph or video may be retained in this repository for testing.
2. Save the original bytes as `fixtures/QA-NNN-short-name.jpeg`, `.mp4` or `.mov`; do not edit them.
3. Copy `cases/QA-000-template.md` and record source, mode and expected behavior.
4. Record `shasum -a 256` so accidental fixture replacement is detectable.
5. Commit the fixture and its case specification together after Pablo's review.

## Running the gate

1. Use the named TEST environment and exact deployed commit.
2. Execute every case marked required for the release candidate.
3. Copy `runs/0000-00-00-template.md` and record observable evidence honestly.
4. Preserve failures and analysis/request references; never copy secrets or tokens.
5. Recommend promotion only when required cases pass or accepted risks are recorded.

## Automated API pass

`agent-api-curl-suite.sh` runs the documented API contract against TEST from a
terminal and reports every check; see [its notes](agent-api-curl-suite.md).
Run it before the manual cases so the API is proven before a person judges results.

Manual QA complements `./e2e/server/run.zsh`; neither result authorizes a merge,
deployment or release by itself.
