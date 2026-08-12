import { ClientError, ERROR_MESSAGES } from "./errors.js";

export async function authenticateCustomer(authorization, verifyIdToken) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
  try {
    const identity = await verifyIdToken(authorization.slice(7));
    if (typeof identity?.uid !== "string") {
      throw new Error("Missing verified identity.");
    }
    return Object.freeze({ ownerId: identity.uid });
  } catch {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
}
