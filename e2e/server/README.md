# Server E2E Test Harness

This folder contains the executable server-side end-to-end test gate.
Run the complete gate from the repository root:

```zsh
./e2e/server/run.zsh
```

## What runs for real

`run.zsh` starts the official Firebase emulators for Auth, Functions,
Firestore, and Storage using `firebase.e2e.json`. The emulators load the
same server source used by deployment. Tests send real HTTP requests,
mint Firebase emulator ID tokens, persist Firestore records, transfer
Storage bytes, and verify the resulting state.

Firebase is therefore **emulated locally**, not replaced with repository
mocks. The isolated project ID is `demo-aishop-e2e`, so the suite cannot
reach the production Firebase project.

## What is simulated

External provider calls use deterministic fixtures or remain disabled.
No request reaches OpenAI. Tests that exercise background processing use
an in-process task queue and invoke the real task handlers explicitly.
The video test uses a real MOV fixture and real FFmpeg frame extraction.

The Storage emulator does not reproduce the complete production resumable
upload protocol. Browser transport tests separately cover interrupted and
resumed chunk transfers.

## What the gate proves

- Authentication and custom claims work with Firebase-format tokens.
- Real handlers enforce authorization and owner isolation.
- HTTP requests produce durable Firestore and Storage state.
- Photograph, administration, and video workflows settle predictably.
- Stored source bytes remain private and byte-identical.

## What the gate does not prove

- The hosted browser UI or browser-to-Firebase integration.
- Production IAM, regions, cold starts, quotas, or network behavior.
- Real Cloud Tasks delivery or real OpenAI recognition quality.
- Production resumable-upload behavior in Google Cloud Storage.

Detailed operating notes live in
[`01-docs/09-build-and-test/server-e2e/`](../../01-docs/09-build-and-test/server-e2e/).
