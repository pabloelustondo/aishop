# End-to-End Happy Path Gate

HumanReviewerInitials: PME

Adopted by Pablo's explicit 2026-08-12 decision after the Sprint 005
lesson: 126 unit tests were green while the assembled system had never
once run end to end. Unit tests prove the pieces; only an end-to-end
run proves the product.

## The rule

At every moment of a system's life there must exist one command that
runs the whole system end to end on a developer machine and answers
PASS or FAIL.

## Requirements

- The gate exists from the first vertical increment of any new system:
  walking skeleton first, features second.
- Every sprint that adds or changes externally observable behavior
  extends the end-to-end suite in the same sprint, happy paths first.
- The suite exercises the real production composition. Simulated edges
  are acceptable and explicitly labeled: emulated cloud services,
  fixture cameras, replayed inputs. Mocked internals are not.
- One command, non-interactive, ordinary developer hardware, minutes
  not hours. A suite too slow or too manual to run often is a defect.
- The run is offline-safe by construction: emulator-only project
  identifiers, no real credentials, no production surface reachable.

## Enforcement points

- A Sprint Plan for observable behavior names the end-to-end suite it
  will extend, or records why none applies.
- A delivered-scope report records the suite's real run result. A
  missing, failing, or skipped run is written down as a gap — never
  assumed, never worked around.
- Independent review reproduces the run before recommending
  acceptance.

## Current gates

- Server side: `./e2e/server/run.zsh`
  (documented in `../09-build-and-test/server-e2e/README.md`).
- Client side: not yet in place; the fixture-camera work item creates
  it. Until then, every client sprint records this gap.
