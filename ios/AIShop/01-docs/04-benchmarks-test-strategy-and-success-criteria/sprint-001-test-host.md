# AIShop iPhone App: Sprint 001 Test Host

## Decision

Decided by Pablo on 2026-09-19, conditional on the macOS probe below passing.
The [Simulator probe](../09-build-and-test/sprint-001-vision-probe.md) failed with
`Failed to create espresso context`. Development, tests that use real Vision,
and the client end-to-end gate therefore run natively on macOS. A physical
iPhone is used once, as the last verification step.

## Why macOS

- By default the Simulator cannot create the compute context that feature prints
  need. Forcing the CPU may work, but is reported to give prints that differ
  from a phone's, so a threshold tuned there might not transfer.
- The `AIShopVision` package already declares macOS, so the same production code
  and tests run there unchanged, offline, from one command.
- macOS prints are reported to match a phone's. That is a third-party report,
  not this project's evidence; the iPhone calibration settles it.

## Order of work

1. macOS probe: run the existing package tests natively and record the result.
   If real Vision fails there too, the sprint stops and this decision is void.
2. Develop every task against the macOS tests and the macOS gate.
3. Verify once on a physical iPhone, last; see
   [iPhone Verification](sprint-001-iphone-verification.md).

## The Simulator

At most a development convenience, for example to lay out the harness screen.
A forced-CPU Vision configuration there is optional, never blocks, and is never
evidence of anything.

## What macOS does not predict

Latency, dropped frames under load, thermal and battery behavior, and camera
behavior. Those remain with Sprint 012 physical-device validation.
