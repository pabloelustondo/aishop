# Environment Separation

DRAFT — not authoritative until Pablo commits it.

Origin: adopted by Pablo on 2026-08-12, after an agent deployed to a
project the documentation called production. Reconstructed 2026-08-13
after the original document could not be located in either repository.

## The problem this solves

An agent that infers an environment from a project name, a config
file, a URL, or a prior command will eventually infer wrongly, and the
wrong inference is unrecoverable. Deployment, data, and identity all
follow the environment; none of them can be undone by noticing later.

## Every plan declares its environments

A sprint plan that touches deployed infrastructure names each
environment it targets, its concrete identity (project, endpoint,
credentials source), and its designation — local, test, or production.
An environment that is not declared is not authorized.

Each declared environment traces to an approved designation document.
A designation asserted only in a plan, a commit message, an agent's
summary, or conversation is not a designation.

## Never resolve an ambiguity yourself

If the repository, the instruction, and the infrastructure disagree
about what an environment is — or if the designation document is
missing, unapproved, or unreadable — the agent stops and asks Pablo.

It does not choose the most likely answer, the most recent claim, the
safest-sounding target, or the one that lets the work continue. This
rule has no exception for urgency, for a target that "is obviously
test", or for a change the agent judges harmless.

## Deployment is separately authorized

Approval of a plan never authorizes a deployment. Each deploy, to each
environment, requires Pablo's explicit authorization for that exact
action, and remains authorized only for that action.

## Absence of an environment

Where no production environment exists, that fact is recorded as a
designation like any other, so that no agent invents one by inference.
