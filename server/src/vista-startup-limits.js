import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { readVistaPackageLimits } from "./vista-package-limits.js";

function discoveryEnvironment(environment) {
  if (environment.FUNCTIONS_CONTROL_API !== "true") return environment;
  const source = readFileSync(new URL("../.env", import.meta.url), "utf8");
  return { ...parseEnv(source), ...environment };
}

export function readVistaStartupLimits(environment = process.env) {
  return readVistaPackageLimits(discoveryEnvironment(environment));
}
