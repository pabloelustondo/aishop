import { createHash } from "node:crypto";
import { classifyVistaVerifierFailure } from "./vista-auth-failure.js";
import { vistaError } from "./vista-package-error.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeVistaRunId(value) {
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : null;
}

export async function authenticateVistaOwner(authorization, verifyIdToken) {
  const token = typeof authorization === "string"
    ? /^Bearer ([^\s]+)$/.exec(authorization)?.[1] : null;
  if (!token) throw vistaError("unauthorized");
  let identity;
  try {
    identity = await verifyIdToken(token);
  } catch (error) {
    throw classifyVistaVerifierFailure(error);
  }
  if (typeof identity?.uid !== "string" || identity.uid.length === 0) {
    throw vistaError("unauthorized");
  }
  const ownerKey = createHash("sha256").update(identity.uid, "utf8").digest("hex");
  return Object.freeze({ ownerKey });
}
