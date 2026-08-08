import { ClientError, ERROR_MESSAGES } from "./errors.js";

const DISPOSITIONS = Object.freeze(["verified", "corrected", "rejected"]);

function invalid() {
  throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
}

export function validateReviewInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid();
  const keys = Object.keys(body);
  if (!keys.includes("disposition") || keys.some((key) => !["disposition", "notes"].includes(key))) {
    invalid();
  }
  if (!DISPOSITIONS.includes(body.disposition)) invalid();
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") {
    invalid();
  }
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length > 2_000) invalid();
  return Object.freeze({ disposition: body.disposition, notes: notes || null });
}
