import assert from "node:assert/strict";
import test from "node:test";
import { agentAPIKey, agentReleaseMetadata } from "../src/firebase-agent-config.js";

test("demo Functions emulator never reads the provider credential", () => {
  assert.equal(agentAPIKey({ FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "demo-aishop-e2e" },
    () => { throw new Error("credential must not be read"); }), null);
});

test("deployed TEST retains its configured provider", () => {
  assert.equal(agentAPIKey({ GCLOUD_PROJECT: "aishop-99d36" }, () => "fake-test-key"), "fake-test-key");
});

test("both emulator flag and demo identity are required to disable the provider", () => {
  for (const env of [
    { GCLOUD_PROJECT: "demo-aishop-e2e" },
    { FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "aishop-99d36" }
  ]) assert.equal(agentAPIKey(env, () => "fake-test-key"), "fake-test-key");
});


test("release uses a valid source commit or the automatic revision without confusing them", () => {
  const revision = { K_REVISION: "api-00025-abc" };
  assert.deepEqual(agentReleaseMetadata(revision), {
    release: "api-00025-abc", releaseKind: "revision"
  });
  assert.deepEqual(agentReleaseMetadata({ ...revision, AGENT_RELEASE_COMMIT: "c3a07f8" }), {
    release: "c3a07f8", releaseKind: "commit"
  });
  for (const invalid of ["", "unknown", "PRIVATE text", "x".repeat(200)]) {
    assert.deepEqual(agentReleaseMetadata({ ...revision, AGENT_RELEASE_COMMIT: invalid }),
      { release: "api-00025-abc", releaseKind: "revision" });
  }
  assert.deepEqual(agentReleaseMetadata({}), { release: "unknown", releaseKind: "unknown" });
});
