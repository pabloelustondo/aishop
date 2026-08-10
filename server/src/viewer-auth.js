import { ClientError, ERROR_MESSAGES } from "./errors.js";

export async function authenticateViewer(authorization, verifyIdToken) {
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
  try {
    const identity = await verifyIdToken(authorization.slice(7));
    if (identity?.reviewer === true) return Object.freeze({ reviewer: true });
    if (typeof identity?.uid === "string") return Object.freeze({ ownerId: identity.uid });
    throw new Error("Missing verified identity.");
  } catch {
    throw new ClientError(401, ERROR_MESSAGES.unauthorized);
  }
}

function isVisibleToViewer(record, viewer) {
  return viewer.reviewer === true || record.ownerId === viewer.ownerId;
}

export async function readDetailForViewer({
  recordReader, scanId, authorization, verifyIdToken
}) {
  const viewer = await authenticateViewer(authorization, verifyIdToken);
  const detail = await recordReader.getDetail(scanId);
  return detail && isVisibleToViewer(detail, viewer) ? detail : null;
}
