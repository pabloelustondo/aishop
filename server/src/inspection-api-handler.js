import { authenticateCustomer } from "./customer-auth.js";
import { ClientError, ERROR_MESSAGES } from "./errors.js";
import { MAX_REQUEST_BYTES } from "./http-server.js";
import { readJson, sendBytes, sendJson } from "./http-json.js";
import {
  readInspectionEvidence, sendInspectionError
} from "./inspection-error-response.js";
import { authenticateReviewer } from "./reviewer-auth.js";

function evidenceScanId(url) {
  const match = url.match(/^\/inspections\/([0-9a-f-]{36})\/evidence$/i);
  return match?.[1] ?? null;
}

export function createInspectionAPIHandler({
  submitInspection, evidenceReader, verifyIdToken, logger = console
}) {
  return async function handle(request, response) {
    try {
      if (request.method === "POST" && request.url === "/inspections") {
        const { ownerId } = await authenticateCustomer(
          request.headers.authorization, verifyIdToken
        );
        const type = request.headers["content-type"]?.split(";", 1)[0].toLowerCase();
        if (type !== "application/json") {
          throw new ClientError(415, ERROR_MESSAGES.invalidRequest);
        }
        sendJson(response, 201, await submitInspection(
          await readJson(request, MAX_REQUEST_BYTES), ownerId
        ));
        return;
      }
      const scanId = request.method === "GET" ? evidenceScanId(request.url) : null;
      if (scanId) {
        await authenticateReviewer(request.headers.authorization, verifyIdToken);
        sendBytes(response, await readInspectionEvidence(evidenceReader, scanId));
        return;
      }
      sendJson(response, 404, { error: ERROR_MESSAGES.notFound });
    } catch (error) {
      sendInspectionError(error, response, logger);
    }
  };
}
