import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Firebase config declares isolated Firestore and Storage emulators", () => {
  const config = JSON.parse(readFileSync(new URL("../../firebase.json",
    import.meta.url)));
  assert.deepEqual(config.emulators, {
    firestore: { port: 8080 },
    storage: { port: 9199 },
    singleProjectMode: true
  });
});
