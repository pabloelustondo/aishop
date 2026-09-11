import * as firebaseLogger from "firebase-functions/logger";
import { agentReleaseMetadata, API_PROCESS_CONTEXT } from "./firebase-agent-config.js";
import { createDiagnostics } from "./agent-diagnostics.js";
import { createAdminAPIHandler } from "./admin-api-handler.js";
import { createFirebaseAdminServices } from "./firebase-services.js";

/** The All-runs routes composed against Firebase. Read-only: no API key, no runner. */
export function createFirebaseAdminHandler({
  logger = firebaseLogger, services: providedServices,
  environment = process.env.FUNCTIONS_EMULATOR === "true" ? "emulator" : "test",
  release, releaseKind
} = {}) {
  const releaseMetadata = release ? { release, releaseKind: releaseKind ?? "override" } : agentReleaseMetadata(process.env);
  const services = providedServices ?? createFirebaseAdminServices();
  const diagnostics = createDiagnostics(event => {
    if (typeof logger.write === "function") return logger.write(event);
    const write = event.severity === "ERROR" ? logger.error : logger.info;
    return write.call(logger, event);
  }, { environment, ...releaseMetadata });
  const handler = createAdminAPIHandler({
    reader: services.reader, identity: services.identity,
    evidenceStore: services.evidenceStore, verifyIdToken: services.verifyIdToken,
    logger, diagnostics
  });
  return (request, response) => handler(request, response, request[API_PROCESS_CONTEXT]);
}
