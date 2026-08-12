import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseEnv } from "node:util";
import {
  APPROVED_VISTA_PACKAGE_LIMITS,
  readVistaPackageLimits
} from "../src/vista-package-limits.js";

const source = readFileSync(new URL("../.env", import.meta.url), "utf8");
const approved = Object.values(APPROVED_VISTA_PACKAGE_LIMITS);
const lines = source.trimEnd().split("\n");

test("deploy source contains exactly the nine approved VISTA limits", () => {
  const environment = parseEnv(source);
  assert.deepEqual(Object.keys(environment).sort(),
    approved.map(({ environment: name }) => name).sort());
  assert.doesNotThrow(() => readVistaPackageLimits(environment));
});

test("each missing or changed deploy-source value fails closed", () => {
  for (const { environment: name, value } of approved) {
    const missing = lines.filter((line) => !line.startsWith(`${name}=`)).join("\n");
    assert.throws(() => readVistaPackageLimits(parseEnv(missing)),
      new RegExp(name));
    const changed = lines.map((line) => line.startsWith(`${name}=`)
      ? `${name}=${value + 1}` : line).join("\n");
    assert.throws(() => readVistaPackageLimits(parseEnv(changed)),
      new RegExp(name));
  }
});
