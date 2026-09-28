# Environment Separation

HumanReviewerInitials: PME

In force for AI Shop from 2026-08-13.

Adopted after Sprint 005, where one Firebase project was called production in
reference docs and development in a work order. No governance rule defined
environments, so the agent resolved that contradiction itself and deployed.
A cross-cutting control, not a thirteenth lifecycle area.

## The rule

Every project declares its environments in the repository before its first
deployment. Every deployment, evidence record, and agent authority is bound to
one named environment.

## Declaration

- The repository names each environment, its exact infrastructure identity,
  its purpose, and its deployment authority.
- One infrastructure identity serves one environment. A project holding a
  single identity has one environment, whose documented name must match what
  it actually is. An undeclared environment cannot be deployed to.

## Test environments

Hold no production data. Agent access may be generous. Load, failure, and
destructive qualification are permitted and expected there before client or
field work depends on the result. Test data may be retained without cleanup.

## Production environments

Created deliberately as separate infrastructure, never by renaming a test
environment. Deployment is authorized per release, agent access is minimal,
test data is never introduced, and privacy, residency, and retention are
decided before the first real user record exists.

## Ambiguity is a stop condition

If the repository, the work order, and the infrastructure disagree about which
environment a target is, the agent stops and reports the contradiction. It
never resolves an environment conflict in its own favour, and an instruction
that assumes an environment does not create one.

## Evidence and promotion

Every evidence record names the environment that produced it. A passing
test-environment run qualifies the test environment only. Creating or
promoting an environment is a recorded human decision, not a deployment step.
