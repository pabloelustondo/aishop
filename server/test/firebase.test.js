import assert from "node:assert/strict";
import test from "node:test";
import { limitEnvironment } from "../test-support/vista-limit-values.js";

Object.assign(process.env, limitEnvironment);
const { api, collectAgentAnalysis, reconcileAgentAnalyses } =
  await import("../src/firebase.js");

test("exports the Firebase v2 HTTP function in Toronto with both secrets", () => {
  assert.equal(typeof api, "function");
  assert.deepEqual(api.__endpoint.region, ["northamerica-northeast2"]);
  assert.equal(api.__endpoint.platform, "gcfv2");
  assert.equal(api.__endpoint.availableMemoryMb, 1024);
  // 120, not 30: a full-shelf areaScan answer runs several thousand tokens and
  // a measured high-model call took 39 s. A timeout discards a completed
  // OpenAI charge and returns nothing. Kept pinned because with
  // maxInstances/concurrency at 1 a long call also blocks package ingest.
  assert.equal(api.__endpoint.timeoutSeconds, 120);
  assert.equal(api.__endpoint.maxInstances, 1);
  assert.equal(api.__endpoint.concurrency, 1);
  assert.deepEqual(api.__endpoint.httpsTrigger.invoker, ["public"]);
  assert.deepEqual(
    api.__endpoint.secretEnvironmentVariables.map((secret) => secret.key).sort(),
    ["AI_SHOP_CLIENT_TOKEN", "OPENAI_API_KEY"]
  );
});

test("exports a private bounded task queue collector in Montréal", () => {
  assert.equal(typeof collectAgentAnalysis, "function");
  assert.deepEqual(collectAgentAnalysis.__endpoint.region,
    ["northamerica-northeast1"]);
  assert.equal(collectAgentAnalysis.__endpoint.platform, "gcfv2");
  assert.equal(collectAgentAnalysis.__endpoint.timeoutSeconds, 60);
  assert.deepEqual(collectAgentAnalysis.__endpoint.taskQueueTrigger.invoker, ["private"]);
  assert.equal(collectAgentAnalysis.__endpoint.taskQueueTrigger.rateLimits
    .maxConcurrentDispatches, 1);
  assert.equal(collectAgentAnalysis.__endpoint.taskQueueTrigger.retryConfig.maxAttempts, 5);
  assert.deepEqual(collectAgentAnalysis.__endpoint.secretEnvironmentVariables
    .map(secret => secret.key), ["OPENAI_API_KEY"]);
});

test("exports the one-minute reconciliation safety net", () => {
  assert.equal(typeof reconcileAgentAnalyses, "function");
  assert.deepEqual(reconcileAgentAnalyses.__endpoint.region,
    ["northamerica-northeast1"]);
  assert.equal(reconcileAgentAnalyses.__endpoint.scheduleTrigger.schedule,
    "every 1 minutes");
  assert.equal(reconcileAgentAnalyses.__endpoint.timeoutSeconds, 60);
});
