import { ClientError, ERROR_MESSAGES } from "./errors.js";
import { readJson, sendJson } from "./http-json.js";
import { authenticateReviewer } from "./reviewer-auth.js";
import { validateReviewInput } from "./review-input.js";
const ID = "([0-9a-f-]{36})";
function routeId(url, suffix = "") {
  return url.match(new RegExp(`^/inspections/${ID}${suffix}$`, "i"))?.[1] ?? null;
}

export function createReviewerAPIHandler({
  verifyIdToken, recordReader, recordStore, logger = console
}) {
  return async function handle(request, response) {
    try {
      const identity = await authenticateReviewer(
        request.headers.authorization,
        verifyIdToken
      );
      if (request.method === "GET" && request.url === "/inspections") {
        sendJson(response, 200, await recordReader.listForReview());
        return;
      }
      const reviewId = request.method === "POST" ? routeId(request.url, "/reviews") : null;
      if (reviewId) {
        const existing = await recordReader.getDetail(reviewId);
        if (!existing) {
          sendJson(response, 404, { error: "Inspection not found." });
          return;
        }
        const review = validateReviewInput(await readJson(request, 32_768));
        const event = await recordStore.appendReview(reviewId, {
          ...review,
          reviewerId: identity.reviewerId
        });
        sendJson(response, 201, { scanId: reviewId, review: event });
        return;
      }
      const detailId = request.method === "GET" ? routeId(request.url) : null;
      const detail = detailId ? await recordReader.getDetail(detailId) : null;
      if (detail) sendJson(response, 200, detail);
      else sendJson(response, 404, { error: ERROR_MESSAGES.notFound });
    } catch (error) {
      if (error instanceof ClientError) sendJson(response, error.status, { error: error.message });
      else {
        logger.error("Unexpected reviewer API failure.");
        sendJson(response, 500, { error: ERROR_MESSAGES.reviewFailed });
      }
    }
  };
}
