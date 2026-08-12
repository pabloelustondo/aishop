import { sendJson } from "./http-json.js";
import {
  VistaPackageError, vistaError, vistaErrorBody
} from "./vista-package-error.js";
import { authenticateVistaOwner } from "./vista-package-identity.js";

function safeError(error) {
  return error instanceof VistaPackageError
    ? error : vistaError("unexpected_server_error", error);
}

export function createVistaPackageAPIHandler({
  submitVistaPackage, verifyIdToken, logger = console
}) {
  return async function handleVistaPackage(request, response) {
    try {
      const { ownerKey } = await authenticateVistaOwner(
        request.headers.authorization, verifyIdToken
      );
      const result = await submitVistaPackage(request, ownerKey);
      sendJson(response, result.status, result.receipt);
    } catch (error) {
      const safe = safeError(error);
      logger.error("VISTA package ingest rejected.",
        { code: safe.code, status: safe.status });
      sendJson(response, safe.status, vistaErrorBody(safe));
    }
  };
}
