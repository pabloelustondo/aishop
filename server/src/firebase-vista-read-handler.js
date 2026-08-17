import { createFirebaseVistaServices } from "./firebase-services.js";
import { createVistaPackageReader } from "./vista-package-read.js";

/**
 * Who may read packages they do not own.
 *
 * Deliberately not in `server/.env`: a fail-closed test asserts that file
 * contains exactly the nine approved VISTA limits and nothing else, and that
 * guard is worth more than the convenience of putting this beside them.
 *
 * POC scope. It exists because the app uploads under an anonymous uid, so the
 * uploader and the reviewer can never be the same identity. When the app
 * signs in as a real account — deferred work named in VISTA's ADR-001 — a
 * person can read their own packages and this list should shrink or go.
 *
 * An email is not a credential; it identifies, it does not authorise. Access
 * still requires a Firebase token whose email is verified.
 */
const REVIEWER_EMAILS = Object.freeze(["pablo.elustondo@gmail.com"]);

export function createFirebaseVistaReadHandler({ logger = console } = {}) {
  const services = createFirebaseVistaServices({
    serverEnvironment: "development",
    ingestVersion: "vista-package-ingest-v1",
    logger
  });
  return createVistaPackageReader({
    firestore: services.firestore,
    bucket: services.bucket,
    verifyIdToken: services.verifyIdToken,
    reviewers: REVIEWER_EMAILS,
    logger
  });
}
