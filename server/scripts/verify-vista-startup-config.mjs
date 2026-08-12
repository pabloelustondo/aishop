import {
  APPROVED_VISTA_PACKAGE_LIMITS,
  readVistaPackageLimits
} from "../src/vista-package-limits.js";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

try {
  const deploySource = readFileSync(new URL("../.env", import.meta.url), "utf8");
  readVistaPackageLimits(parseEnv(deploySource));
  console.log("VISTA startup configuration matches every approved limit.");
} catch (error) {
  const name = Object.values(APPROVED_VISTA_PACKAGE_LIMITS)
    .find(({ environment }) => error.message.startsWith(environment))?.environment;
  console.error(`${name ?? "VISTA_LIMIT_CONFIGURATION"} is not approved.`);
  process.exitCode = 1;
}
