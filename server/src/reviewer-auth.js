import { ClientError, ERROR_MESSAGES } from "./errors.js";

export async function authenticateReviewer(authorization, verifyIdToken) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
  try {
    const identity = await verifyIdToken(authorization.slice(7));
    if (identity?.reviewer !== true || typeof identity.uid !== "string") {
      throw new Error("Missing reviewer claim.");
    }
    return Object.freeze({ reviewerId: identity.uid });
  } catch {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
}
