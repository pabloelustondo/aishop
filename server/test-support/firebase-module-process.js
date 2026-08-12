import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { APPROVED_VISTA_PACKAGE_LIMITS } from "../src/vista-package-limits.js";

const server = new URL("../", import.meta.url);
const approved = Object.values(APPROVED_VISTA_PACKAGE_LIMITS);

function environmentWith(overrides = {}, includeApproved = true) {
  const environment = { ...process.env };
  for (const { environment: name, value } of approved) {
    delete environment[name];
    if (includeApproved) environment[name] = String(value);
  }
  for (const [name, value] of Object.entries(overrides)) {
    if (value === null) delete environment[name];
    else environment[name] = String(value);
  }
  return environment;
}

function run(arguments_, overrides, includeApproved) {
  return spawnSync(process.execPath, arguments_, { encoding: "utf8",
    cwd: fileURLToPath(server),
    env: environmentWith(overrides, includeApproved) });
}

export function importFirebaseWithVistaEnvironment(overrides) {
  return run(["--input-type=module", "--eval",
    "await import('./src/firebase.js')"], overrides, true);
}

export function importFirebaseForDeploymentDiscovery(overrides) {
  return run(["--input-type=module", "--eval",
    "await import('./src/firebase.js')"],
  { FUNCTIONS_CONTROL_API: "true", ...overrides }, false);
}

export function runVistaDeploymentPreflight(overrides) {
  return run(["scripts/verify-vista-startup-config.mjs"], overrides, false);
}
