#!/usr/bin/env node
/**
 * Grants, revokes or shows an access claim on one Firebase account.
 *
 *   node scripts/agent-access.mjs grant  <email|uid> --project <id> [--role agent|admin]
 *   node scripts/agent-access.mjs revoke <email|uid> --project <id> [--role agent|admin]
 *   node scripts/agent-access.mjs show   <email|uid> --project <id>
 *
 * Pablo runs this on his own machine with his own Application Default
 * Credentials; the server never does. `--project` is mandatory because the
 * only thing worse than granting the wrong account is granting it on the
 * wrong project. With `FIREBASE_AUTH_EMULATOR_HOST` set it talks to the
 * emulator and needs no credentials at all.
 *
 * It prints the uid and the claims after the change. It never prints a
 * token, a password, or anything it did not already receive on the command
 * line. Revoking removes the claim and revokes the account's refresh tokens,
 * so a token already in a script's hands stops working at its next use —
 * the server verifies with `checkRevoked`.
 */

import { pathToFileURL } from "node:url";

export const ROLES = Object.freeze(["agent", "admin"]);
const ACTIONS = Object.freeze(["grant", "revoke", "show"]);
const PROJECT = /^[a-z][a-z0-9-]{4,62}$/;

export class UsageError extends Error {}

/** Pure: the command line becomes a plan, or a usage error. */
export function parseArguments(argv) {
  const [action, subject, ...rest] = argv;
  if (!ACTIONS.includes(action)) throw new UsageError(`Action must be one of ${ACTIONS.join(", ")}.`);
  if (typeof subject !== "string" || subject.trim() === "" || subject.startsWith("--")) {
    throw new UsageError("An email address or uid is required.");
  }
  const options = { role: "agent", project: null };
  for (let index = 0; index < rest.length; index += 2) {
    const [flag, value] = [rest[index], rest[index + 1]];
    if (flag === "--project" && typeof value === "string") options.project = value;
    else if (flag === "--role" && typeof value === "string") options.role = value;
    else throw new UsageError(`Unrecognised argument: ${flag}`);
  }
  if (!options.project || !PROJECT.test(options.project)) {
    throw new UsageError("--project <firebase-project-id> is required.");
  }
  if (!ROLES.includes(options.role)) throw new UsageError(`--role must be one of ${ROLES.join(", ")}.`);
  return Object.freeze({ action, subject: subject.trim(), ...options });
}

/**
 * Pure: the claims an account should carry after the action. Other claims —
 * `reviewer`, the other role — are preserved untouched; this tool changes
 * exactly one key.
 */
export function nextClaims(current, role, action) {
  const claims = { ...(current ?? {}) };
  if (action === "grant") claims[role] = true;
  else if (action === "revoke") delete claims[role];
  return claims;
}

/** Only the keys this tool manages are shown, so the output is a fact about access. */
export function describe(user) {
  const claims = user.customClaims ?? {};
  return {
    uid: user.uid,
    disabled: user.disabled === true,
    claims: Object.fromEntries(ROLES.map((role) => [role, claims[role] === true]))
  };
}

async function resolveUser(auth, subject) {
  return subject.includes("@") ? auth.getUserByEmail(subject) : auth.getUser(subject);
}

export async function execute(plan, auth) {
  const user = await resolveUser(auth, plan.subject);
  if (plan.action === "show") return describe(user);
  await auth.setCustomUserClaims(user.uid, nextClaims(user.customClaims, plan.role, plan.action));
  if (plan.action === "revoke") await auth.revokeRefreshTokens(user.uid);
  return describe(await auth.getUser(user.uid));
}

async function main() {
  let plan;
  try {
    plan = parseArguments(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  const { initializeApp, applicationDefault } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const emulated = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const app = initializeApp(emulated
    ? { projectId: plan.project }
    : { projectId: plan.project, credential: applicationDefault() });
  try {
    const outcome = await execute(plan, getAuth(app));
    process.stdout.write(`${JSON.stringify({ project: plan.project, action: plan.action, role: plan.role, ...outcome }, null, 2)}\n`);
    if (plan.action !== "show") {
      process.stdout.write("The change is in the account's next ID token: sign in again or refresh.\n");
    }
  } catch (error) {
    // Firebase error codes are safe to show; their messages can echo the subject.
    process.stderr.write(`Failed: ${error?.code ?? error?.message ?? "unknown error"}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
