import { randomUUID } from "node:crypto";

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


// One value drives both the deployed setting and its diagnostic byte limit.
export const FUNCTION_MEMORY_GIB = 1;
export const FUNCTION_MEMORY = `${FUNCTION_MEMORY_GIB}GiB`;
export const FUNCTION_MEMORY_BYTES = FUNCTION_MEMORY_GIB * 1024 ** 3;
export const API_PROCESS_CONTEXT = Symbol("api-process-context");

/** Create once at the common function entry, not when the agent is first used. */
export function createProcessContext({ instanceId = randomUUID(), uptime = () => process.uptime() } = {}) {
  let invocationSequence = 0;
  return () => {
    invocationSequence++;
    return {
      processInstanceId: instanceId, invocationSequence,
      firstRequestOnProcess: invocationSequence === 1,
      processUptimeMs: uptime() * 1000,
      memoryLimitBytes: FUNCTION_MEMORY_BYTES
    };
  };
}
