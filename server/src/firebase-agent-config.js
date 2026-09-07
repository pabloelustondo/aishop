/** Only the local demo composition disables paid agent analysis. */
export function agentAPIKey(environment, readSecret) {
  if (environment.FUNCTIONS_EMULATOR === "true"
    && environment.GCLOUD_PROJECT === "demo-aishop-e2e") return null;
  return readSecret();
}
