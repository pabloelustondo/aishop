# Individual Agent API tests and administration scripts

One file performs one test or one account/role operation. Nothing runs as a suite.
Run from the repository root. Requires Bash, curl, jq, Node and server dependencies.

## API tests

Start a Bash shell first (the normal macOS prompt may be zsh):

```sh
bash
```

Then run ONE command at a time, inspect its output and record its result:

```bash
source scripts/agent-api-tests/001-health.sh
source scripts/agent-api-tests/002-missing-auth.sh
source scripts/agent-api-tests/003-invalid-token.sh
source scripts/agent-api-tests/004-sign-in.sh
source scripts/agent-api-tests/005-authorized-list.sh
source scripts/agent-api-tests/006-token-roles.sh
```

Sign-in must be sourced: TOKEN stays in this Bash, not on disk.
Do not enable tracing, print TOKEN or put a password in a command.
When finished: `source scripts/agent-api-tests/clear-token.sh`.
HTTP output is evidence; a zero curl exit status is not an API acceptance claim.

## Individual administration operations

Files under agent-admin are separate tasks, not a batch.
The show script reproduces step 007 and post-grant verification.
Each grant script names one exact account and role; executing it changes TEST access.
The two Pablo grants reproduce step 008; the six Agent grants reproduce step 009.
Agent grants preserve existing Admin and unrelated claims.
Use `bash scripts/agent-admin/<filename>.sh` only for the intended operation.
They require Application Default Credentials and target aishop-99d36 only.
Do not repeat grants simply to test the API; sign in again after role changes.

These files replace the combined dispatcher at Pablo's request.
Future commands are saved as individual scripts before execution.
Only syntax has been checked; these new scripts have not made live requests.
Prior evidence: [guided test records](../docs/10-review-and-release/agent-vision-api-test/README.md).
