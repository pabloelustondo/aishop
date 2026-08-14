# Disposition — Function Memory Pre-Work

Pablo's disposition of 2026-08-13 on prompt
[04](04-prompt-function-memory-and-realistic-package-measurement.md).

## ACCEPT

## Correction: the deploy succeeded

Codex reported that the deploy "did not complete" and that live verification
still showed 256 MiB. That was accurate when written — the deploy output
ended mid-update with no completion line, and the check immediately after
still read 256 MiB. The update settled afterwards.

Verified independently on 2026-08-13:

```text
firebase functions:list --project aishop-99d36
api │ v2 │ https │ northamerica-northeast2 │ 1024 │ nodejs22
```

**The function runs at 1 GiB.** No second deploy is needed, and the
measurement record's live-verification line is superseded by this one.

Lesson recorded: a Firebase functions deploy can settle after its command
returns without a conclusion. Verify again before concluding it failed.

## The unmeasured package was correct behaviour

No package was submitted because a realistic 36–60 MB package exceeds the
approved 25 MiB `packageBytes` limit, and no real user-token path existed.
Codex stopped rather than weakening a limit to make a measurement pass,
which is what the prompt required of it.

The conflict was in the prompt, not the execution: it asked for a package
the approved limits forbid. The measurement is folded into prompt
[05](05-prompt-raise-package-limit-and-measure.md), which raises the limit
first and then measures against it.

## Outstanding

Codex's change raising `api` to 1 GiB in `server/src/firebase.js` is
**uncommitted** in worktree `codex/sprint-005-vista-package-ingest`. Live
infrastructure and committed code currently disagree: a redeploy from
`main` would take the function back to 256 MiB. Committing it is Pablo's.

## Limits

Accepts this pre-work only. Authorizes no deploy, commit, push, or release.
