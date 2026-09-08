/** Only the local demo composition disables paid agent analysis. */
export function agentAPIKey(environment, readSecret) {
  if (environment.FUNCTIONS_EMULATOR === "true"
    && environment.GCLOUD_PROJECT === "demo-aishop-e2e") return null;
  return readSecret();
}

/** Preserve the distinction between an optional source commit and a runtime revision. */
export function agentReleaseMetadata(environment) {
  const commit = environment.AGENT_RELEASE_COMMIT;
  if (typeof commit === "string" && /^[a-f0-9]{7,64}$/.test(commit)) {
    return { release: commit, releaseKind: "commit" };
  }
  const revision = environment.K_REVISION;
  if (typeof revision === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(revision)) {
    return { release: revision, releaseKind: "revision" };
  }
  return { release: "unknown", releaseKind: "unknown" };
}
