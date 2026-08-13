# End-to-End Happy Path Gate

DRAFT — not authoritative until Pablo commits it.

Origin: adopted by Pablo on 2026-08-12. Reconstructed 2026-08-13 after
the original document could not be located in either repository; the
sprint plan that cited it by filename could not be verified against it.

## The problem this solves

A system can pass every unit test, every component test, and every
review, and still have never once run end to end. Integration defects
then surface at the last possible moment — on a device, in a store, in
front of a customer — where they cost most and diagnose worst.

## The gate

Every sprint whose increment changes observable behaviour names the
end-to-end suite it extends, and leaves that suite passing.

The suite is **one always-runnable command**. It proves the whole
system along its happy path, from the first increment onward — not a
mock of it, not a fragment of it, and not a procedure a human performs.

An increment that cannot yet reach the full path extends the suite as
far as it genuinely reaches, and the sprint plan states exactly where
the coverage stops and why. Declaring a shorter reach is honest;
implying a longer one is not.

## Happy paths first

Adversarial and degraded cases — corrupt input, oversize payloads,
concurrency, expired credentials — are valuable and deferred. They do
not belong in the gate until the happy path runs green, because a
suite that fails for many reasons proves nothing about any of them.

## What the sprint plan must state

The suite's exact command; its coverage and its limits; the environment
it runs against; and its observed result. A plan that changes behaviour
without naming its suite cannot be approved.

## What this gate is not

A green suite is evidence, never a definition of completion. It does
not replace component tests, review, device testing, or human
acceptance.
