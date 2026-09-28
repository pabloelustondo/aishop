# Pattern: a runbook for manual steps

## Speaker notes

Whenever acceptance needs a person to do something by hand, the deck gives the steps.

Number them. One action per step. Say what the person should see.

Give exact names: the scheme, the button, the command.

Only include a command the implementing agent has actually run.

Say what each outcome means and what happens next, including the bad outcomes.

The runbook is for the person who was not there when the code was written.

Here that person is Pablo, holding a phone, once, at the end of the sprint.

A runbook that fails on its first use wastes the one session the plan allows.

So the agent rehearses every step it can rehearse without the device.

Anything it could not rehearse is marked as untested in the notes.

In the example, the exit codes are read from the comparison tool's source.

The phone steps themselves are untested until the session happens.

## Fine print

- [Phone verification rules](../../../../ios/AIShop/01-docs/04-benchmarks-test-strategy-and-success-criteria/sprint-001-iphone-verification.md)
- [Comparison tool and its exit codes](../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluate/main.swift)
- [Mac gate](../../../../e2e/ios/run.zsh)
