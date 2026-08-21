import assert from "node:assert/strict";
import test from "node:test";
import { limitEnvironment } from "../test-support/vista-limit-values.js";

Object.assign(process.env, limitEnvironment);
const { api } = await import("../src/firebase.js");

test("exports the Firebase v2 HTTP function in Toronto with both secrets", () => {
  assert.equal(typeof api, "function");
  assert.deepEqual(api.__endpoint.region, ["northamerica-northeast2"]);
  assert.equal(api.__endpoint.platform, "gcfv2");
  assert.equal(api.__endpoint.availableMemoryMb, 1024);
  assert.equal(api.__endpoint.timeoutSeconds, 30);
  assert.equal(api.__endpoint.maxInstances, 1);
  assert.equal(api.__endpoint.concurrency, 1);
  assert.deepEqual(api.__endpoint.httpsTrigger.invoker, ["public"]);
  assert.deepEqual(
    api.__endpoint.secretEnvironmentVariables.map((secret) => secret.key).sort(),
    ["AI_SHOP_CLIENT_TOKEN", "OPENAI_API_KEY"]
  );
});
