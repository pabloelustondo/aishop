import { createFirebaseVistaServices } from "./firebase-services.js";
import { createVistaPackageSubmitter } from "./submit-vista-package.js";
import { createVistaPackageAPIHandler } from "./vista-package-api-handler.js";

export function createFirebaseVistaPackageHandler({ limits, logger = console }) {
  const services = createFirebaseVistaServices({
    serverEnvironment: "development",
    ingestVersion: "vista-package-ingest-v1",
    logger
  });
  const submitVistaPackage = createVistaPackageSubmitter({
    limits, evidenceStore: services.evidenceStore, recordStore: services.recordStore
  });
  return createVistaPackageAPIHandler({
    submitVistaPackage, verifyIdToken: services.verifyIdToken, logger
  });
}
