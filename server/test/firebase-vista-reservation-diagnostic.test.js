import assert from "node:assert/strict";
import test from "node:test";
import {
  createFirebaseVistaReservationDiagnostic
} from "../src/firebase-vista-reservation-diagnostic.js";

test("Firebase logs only the bounded receiving-resume event", () => {
  const logs = [];
  const logger = { warn: (...values) => logs.push(values) };
  const emit = createFirebaseVistaReservationDiagnostic(logger);
  const event = Object.freeze({ schemaVersion: 1,
    event: "vista.package.receiving_resumed", state: "receiving" });
  emit(event);
  assert.deepEqual(logs, [["VISTA receiving reservation resumed.", event]]);
  assert.doesNotMatch(JSON.stringify(logs), /uid|runId|token|provider|private/i);
});
