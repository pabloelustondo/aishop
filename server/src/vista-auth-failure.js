import { vistaError } from "./vista-package-error.js";

const CREDENTIAL_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/mismatching-tenant-id",
  "auth/user-disabled",
  "auth/user-not-found"
]);
const CERTIFICATE_FETCH_PREFIX = "Error fetching public keys for Google certs:";
const NETWORK_FAILURE_PREFIX = "Error while making request:";

export function classifyVistaVerifierFailure(error) {
  const argumentInfrastructureFailure = error?.code === "auth/argument-error" &&
    typeof error.message === "string" &&
    (error.message.startsWith(CERTIFICATE_FETCH_PREFIX) ||
      error.message.startsWith(NETWORK_FAILURE_PREFIX));
  const credentialFailure = CREDENTIAL_CODES.has(error?.code) &&
    !argumentInfrastructureFailure;
  return vistaError(credentialFailure ? "unauthorized" : "unexpected_server_error");
}
