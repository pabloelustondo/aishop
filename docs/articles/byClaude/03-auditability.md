# Why Auditability Is the Interesting Part

HumanReviewerInitials: PME

The earliest version of AI Shop was a one-shot loop: photo in, model
answer out, nothing kept. That's fine for a novelty demo and fragile for
anything a person would actually rely on — if the model is wrong, or
right for the wrong reason, there's no way to know after the fact.

## The shift

`architecture-02-audit-storage-and-human-review.md` changes the contract.
The original image is now hashed and stored under a unique, non-
overwriting path — it can never be silently replaced or lost to a later
write. The AI's initial findings are written once and never mutated. A
human reviewer's verdict — verified, corrected, or rejected — is stored
separately from the AI output, with its own server timestamp, and is
explicitly append-only.

## The underlying principle

AI output is treated as unverified evidence, not a conclusion, until a
human says otherwise. That's a deliberate, unusual discipline for a
small proof of concept to impose on itself this early — most projects
this size skip straight to trusting the model. It means every claim the
system makes about a product is, in principle, traceable back to the
exact photo and the exact reviewer decision that stand behind it.

## Why it matters beyond this project

This is the part of AI Shop that generalizes past grocery shopping: any
system that turns a camera image into an AI judgment people act on
benefits from the same shape — keep the original evidence immutable,
keep the AI's first answer immutable, and keep human review as a
separate, attributable, append-only layer on top.
