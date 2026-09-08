import test from "node:test";
import assert from "node:assert/strict";
import {
  createDiagnostics, sanitizeDiagnostics, DIAGNOSTIC_ERROR_CODES
} from "../src/agent-diagnostics.js";
import { AGENT_API_ERROR_CODES } from "../src/agent-api-error.js";

test("diagnostic boundary excludes private fields and maps trace severity", () => {
  const events = [];
  const emit = createDiagnostics(event => events.push(event));
  emit("run.failed", {
    requestId: "abc-123", failureClass: "provider_output_limit", trace: "a".repeat(32),
    project: "demo-aishop-e2e", note: "PRIVATE", providerBody: "PRIVATE", durationMs: 5
  });
  assert.equal(events[0].severity, "ERROR");
  assert.equal(events[0]["logging.googleapis.com/trace"],
    "projects/demo-aishop-e2e/traces/" + "a".repeat(32));
  assert.ok(!JSON.stringify(events).includes("PRIVATE"));
  assert.deepEqual(sanitizeDiagnostics({
    failureClass: "PRIVATE", usage: { inputTokens: 12, text: "PRIVATE" }
  }), { usage: { inputTokens: 12 } });
});

test("sink failure cannot replace business outcome", () => {
  assert.doesNotThrow(() => createDiagnostics(() => {
    throw Error("sink");
  })("run.failed", {}));
});

test("every public API error code is retained and no additional code is allowed", () => {
  assert.deepEqual(new Set(DIAGNOSTIC_ERROR_CODES), new Set(AGENT_API_ERROR_CODES));
  for (const errorCode of AGENT_API_ERROR_CODES) {
    assert.equal(sanitizeDiagnostics({ errorCode }).errorCode, errorCode);
  }
});
