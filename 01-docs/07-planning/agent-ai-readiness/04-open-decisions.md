# Open Decisions

Only Pablo settles these. The first five block Increment 0.

## Blocking

**D1 — Sprint 007.** `sprint-007-server-recognition/01-sprint-plan.md`
was drafted 2026-08-20, never approved, and partly implemented anyway:
its "server analysis" story is the live analyse route. Agent AI replaces
its design. Supersede it with a new sprint and record why, or revise it
in place? Either way the already-built route needs a home in the record.

**D2 — What the existing recognizer is for.** The synchronous Node path
works today. The specification's own first question is whether Agent AI
is a benchmark service, the default recognizer, or both. Until that is
answered, Increment 0 cannot say whether it is building a replacement or
a second opinion, and the two have different contracts.

**D3 — Python now or later.** A second runtime is a second toolchain,
deploy target, dependency set and test lane. It could also be deferred:
Increment 0 is contracts, fixtures and a skeleton, all of which can be
proven in Node first, with the runtime decision made on Increment 1's
measured needs. Accepting Python in Increment 0 is defensible; it should
be chosen, not inherited from the proposal.

**D4 — Where contracts live.** `server/contracts/` is a received-bundle
inbox, not a registry (see [02](02-contract-inventory.md)). Options: a
new sibling directory for authored contracts; a root `contracts/`; or
authored contracts inside `server/contracts/agent-ai/` with the bundle
relabelled as received material.

**D5 — The end-to-end gate.** `end-to-end-happy-path-gate.md` requires
one command, offline, minutes not hours, from the first increment. If
Increment 0 introduces a worker, `./e2e/server/run.zsh` must start it
and prove a round trip. That work belongs in Increment 0's scope or the
sprint records a gap on day one.

## Not blocking, but dated

`npm test` fails 20 of 158 tests on any non-macOS machine: `sharp` is
installed for darwin only. Green on your Mac, red everywhere else.

## Deferred to Increment 1

Identity granularity, the facing rule for partial and stacked packages,
provider and model, whether OCR is allowed, confidence thresholds,
retention and region, and cost ceilings. The specification lists all of
these as Pablo's; none is needed to define contracts and fixtures.
