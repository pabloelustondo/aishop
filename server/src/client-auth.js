import { timingSafeEqual } from "node:crypto";

export function requireClientToken(clientToken) {
  if (typeof clientToken !== "string" || clientToken.trim() === "") {
    throw new Error("AI_SHOP_CLIENT_TOKEN is required.");
  }
}

export function isAuthorized(authorizationHeader, clientToken) {
  if (typeof authorizationHeader !== "string") return false;

  const provided = Buffer.from(authorizationHeader, "utf8");
  const expected = Buffer.from(`Bearer ${clientToken}`, "utf8");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
