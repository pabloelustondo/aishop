import assert from "node:assert/strict";
import test from "node:test";
import { createFirebaseAPIRouter } from "../src/firebase-api-router.js";

function router(calls) {
  const handler = (name) => async () => { calls.push(name); };
  return createFirebaseAPIRouter({ vistaHandler: handler("vista"),
    inspectionHandler: handler("inspection"), legacyHandler: handler("legacy") });
}

test("routes only the exact VISTA POST endpoint to package ingest", async () => {
  const calls = [];
  const route = router(calls);
  await route({ method: "POST", url: "/v1/vista/inspection-packages" }, {});
  await route({ method: "GET", url: "/v1/vista/inspection-packages" }, {});
  await route({ method: "POST", url: "/v1/vista/inspection-packages/extra" }, {});
  assert.deepEqual(calls, ["vista", "legacy", "legacy"]);
});

test("preserves inspection and legacy routing", async () => {
  const calls = [];
  const route = router(calls);
  await route({ method: "POST", url: "/inspections" }, {});
  await route({ method: "GET", url: "/inspections/id/evidence" }, {});
  await route({ method: "POST", url: "/analyze-product" }, {});
  assert.deepEqual(calls, ["inspection", "inspection", "legacy"]);
});

test("routes VISTA sub-path POST to the reader, which owns analysis", async () => {
  const calls = [];
  const handler = (name) => async () => { calls.push(name); };
  const route = createFirebaseAPIRouter({
    vistaHandler: handler("vista"), vistaReadHandler: handler("read"),
    inspectionHandler: handler("inspection"), legacyHandler: handler("legacy")
  });
  // Ingest still owns POST on the collection itself.
  await route({ method: "POST", url: "/v1/vista/inspection-packages" }, {});
  await route({ method: "POST",
    url: "/v1/vista/inspection-packages/RUN/artifacts/HASH/analysis" }, {});
  await route({ method: "GET", url: "/v1/vista/inspection-packages/RUN" }, {});
  // A method the reader does not serve must not reach ingest.
  await route({ method: "DELETE", url: "/v1/vista/inspection-packages/RUN" }, {});
  assert.deepEqual(calls, ["vista", "read", "read", "legacy"]);
});

test("routes the agent namespace to the agent handler, whatever the method", async () => {
  const calls = [];
  const handler = (name) => async () => { calls.push(name); };
  const route = createFirebaseAPIRouter({
    vistaHandler: handler("vista"), vistaReadHandler: handler("read"),
    agentHandler: handler("agent"),
    inspectionHandler: handler("inspection"), legacyHandler: handler("legacy")
  });

  await route({ method: "POST", url: "/v1/agent/analyses" }, {});
  await route({ method: "GET", url: "/v1/agent/analyses" }, {});
  await route({ method: "GET", url: "/v1/agent/analyses/abc" }, {});
  await route({ method: "POST", url: "/v1/agent/analyses/abc/run" }, {});
  // Unknown sub-paths are the agent handler's own 404 to give, not the
  // legacy handler's: a caller of this namespace gets its error shape.
  await route({ method: "DELETE", url: "/v1/agent/other" }, {});

  assert.deepEqual(calls, ["agent", "agent", "agent", "agent", "agent"]);
});

test("leaves every existing route untouched when the agent handler is present", async () => {
  const calls = [];
  const handler = (name) => async () => { calls.push(name); };
  const route = createFirebaseAPIRouter({
    vistaHandler: handler("vista"), vistaReadHandler: handler("read"),
    agentHandler: handler("agent"),
    inspectionHandler: handler("inspection"), legacyHandler: handler("legacy")
  });

  await route({ method: "POST", url: "/v1/vista/inspection-packages" }, {});
  await route({ method: "GET", url: "/v1/vista/inspection-packages/RUN" }, {});
  await route({ method: "POST", url: "/inspections" }, {});
  await route({ method: "GET", url: "/inspections/id/evidence" }, {});
  await route({ method: "POST", url: "/analyze-product" }, {});
  // A path that merely begins with the same letters is not the namespace.
  await route({ method: "GET", url: "/v1/agentine" }, {});

  assert.deepEqual(calls,
    ["vista", "read", "inspection", "inspection", "legacy", "legacy"]);
});

test("falls through to legacy when no agent handler is composed", async () => {
  const calls = [];
  const route = router(calls);
  await route({ method: "POST", url: "/v1/agent/analyses" }, {});
  assert.deepEqual(calls, ["legacy"]);
});
