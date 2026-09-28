# Server E2E — Plain-Language Test Report

HumanReviewerInitials: PME

**Date:** 2026-08-12 · **Result: ALL PASSING** · Run time: ~30 seconds

## What we built, in one paragraph

We start a "fake Google cloud" on the Mac (the Firebase emulators:
login service, database, file storage). Into it we load the **real
server code** — the exact code that would be deployed, nothing mocked.
Then a small script pretends to be the iPhone: it logs in, gets a real
token, and uploads a real inspection package over plain HTTP. All local,
free, offline, and impossible to touch the real cloud by construction.

## The payload

The upload is the official "golden package" from the contract fixtures:
one manifest, one audit JSON, one real JPEG photo — sent as a normal
multipart HTTP POST, exactly like the phone will send it.

## Scenarios tested so far

| # | What the fake iPhone does | What the server must answer | Result |
|---|---|---|---|
| 1 | Uploads the golden package with a valid login | `201` + a signed receipt | PASS |
| 2 | Uploads the exact same package again | `200` + the **identical** receipt (no duplicate) | PASS |
| 3 | Uploads without logging in | `401` rejected, before any work | PASS |

Along the way this also proved: the JPEG was genuinely decoded
(sharp), the receipt was written in a real database transaction, the
photo bytes landed in real (emulated) file storage, and the server
booted only because its nine safety limits were configured.

## What this does NOT prove yet

- Real Google cloud behavior: bucket permissions, cold starts, and the
  Node 22 Linux runtime (locally we ran Node 26 on macOS).
- The scenarios still on the ladder: wrong manifest (`409`), corrupt
  JPEG, oversized upload (`413`), concurrency, `/inspections` guard.

## Run it yourself

```zsh
./e2e/server/run.zsh
```

One command, ~30 seconds, ends with `PASS step-01` and exit code 0.
