import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { APPROVED_VISTA_PACKAGE_LIMITS } from "../src/vista-package-limits.js";
import {
  runVistaDeploymentPreflight
} from "../test-support/firebase-module-process.js";

const approved = Object.values(APPROVED_VISTA_PACKAGE_LIMITS);

test("deployment preflight reads the deploy source, not shell overrides", () => {
  assert.equal(runVistaDeploymentPreflight().status, 0);
  for (const { environment, value } of approved) {
    const changed = runVistaDeploymentPreflight({ [environment]: value + 1 });
    assert.equal(changed.status, 0, changed.stderr);
  }
});

test("Firebase deploy invokes the bounded VISTA preflight", () => {
  const firebase = JSON.parse(readFileSync(new URL("../../firebase.json",
    import.meta.url)));
  const packageValue = JSON.parse(readFileSync(new URL("../package.json",
    import.meta.url)));
  assert.deepEqual(firebase.functions.predeploy,
    ["npm --prefix \"$RESOURCE_DIR\" run predeploy:vista"]);
  assert.equal(packageValue.scripts["predeploy:vista"],
    "node scripts/verify-vista-startup-config.mjs");
});
