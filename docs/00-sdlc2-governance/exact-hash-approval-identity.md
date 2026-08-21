# Exact-Hash Approval Identity

HumanReviewerInitials:

DRAFT — Sprint 006 candidate; not authoritative until approved.

Origin: VISTA activation-envelope practice and Sprint 005 field use,
retrofitted 2026-08-12.

## Hashes make approvals portable and checkable

Initials plus staging approve exact bytes. To make that identity
verifiable across agents, sessions, and time:

- Every request for approval states the candidate file's SHA-256.
- Every delivered-scope report, review, and disposition repeats the
  hashes of the artifacts it relies on.
- A reviewer reproduces hashes independently; a mismatch is a stop,
  not an inconvenience. Adding initials changes the bytes, so a
  post-approval file equals the reviewed hash after the initials line
  is normalized back to blank.

## Activation-envelope preservation

When a pointer record is activated as `READY`, the executing agent
captures the pointer path and the SHA-256 of its exact staged `READY`
bytes before any state change. That pair is repeated in the response,
independent QA, review, and the human disposition. No later staging
replaces the staged `READY` blob until the disposition records the
independently verified pair. Retained initials attest to the staged
envelope, never to later working-tree bytes.

## Recorded approval transcription

When Pablo explicitly instructs an agent to enter `PME` on his behalf,
the transcription is valid only with a same-increment record document
stating: the quoted human instruction and date, every file with its
exact pre-approval SHA-256, disclosure of authorship, and the
statement that no standing delegation is created. Sprint 005 documents
`03-approval-transcription-and-vendored-integrity-exception.md` and
the server-e2e `04-approval-transcription-record.md` are the
precedents. A transcription bound to superseded hashes is void; the
revised content needs a fresh decision.

## Invalidation

Any edit after approval — including formatting — invalidates approval
for the changed content. The agent unstages, clears initials, and
re-presents with new hashes. Git history preserves the prior decision.
