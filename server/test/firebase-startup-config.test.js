import assert from "node:assert/strict";
import test from "node:test";
import { APPROVED_VISTA_PACKAGE_LIMITS } from "../src/vista-package-limits.js";
import {
  importFirebaseForDeploymentDiscovery, importFirebaseWithVistaEnvironment
} from "../test-support/firebase-module-process.js";

const approved = Object.values(APPROVED_VISTA_PACKAGE_LIMITS);

test("Firebase entry imports only with every exact VISTA limit", () => {
  const exact = importFirebaseWithVistaEnvironment();
  assert.equal(exact.status, 0, exact.stderr);
  for (const { environment, value } of approved) {
    const missing = importFirebaseWithVistaEnvironment({ [environment]: null });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, new RegExp(environment));
    const changed = importFirebaseWithVistaEnvironment({ [environment]: value + 1 });
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, new RegExp(environment));
  }
});

test("Firebase CLI discovery loads the exact tracked deploy source", () => {
  const discovery = importFirebaseForDeploymentDiscovery();
  assert.equal(discovery.status, 0, discovery.stderr);
  const invalid = importFirebaseForDeploymentDiscovery({
    VISTA_MAX_MANIFEST_BYTES: "1"
  });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /VISTA_MAX_MANIFEST_BYTES/);
});
