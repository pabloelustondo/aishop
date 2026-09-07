import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SOURCE = "/v1/agent/analyses{,/**}";

const configuration = () => JSON.parse(
  readFileSync(new URL("../../firebase.json", import.meta.url))
);

/**
 * The rewrite has to cover the sub-paths as well as the collection: the run
 * and read operations live at `/{analysisId}` and `/{analysisId}/run`, and an
 * exact-path rewrite leaves Hosting answering 404 for both.
 */
test("hosting rewrites the agent analyses endpoint and its sub-paths to the Toronto API", () => {
  const rewrite = configuration().hosting.rewrites.find(({ source }) => source === SOURCE);
  assert.deepEqual(rewrite, {
    source: SOURCE,
    function: { functionId: "api", region: "northamerica-northeast2" }
  });
});

test("no narrower agent rewrite shadows it", () => {
  const agent = configuration().hosting.rewrites
    .filter(({ source }) => source.startsWith("/v1/agent"));
  // Hosting applies the first matching rewrite, so an earlier exact-path
  // entry would silently take the collection route back.
  assert.deepEqual(agent.map(({ source }) => source), [SOURCE]);
});

test("the agent page is served by hosting and never rewritten to the function", () => {
  const rewrites = configuration().hosting.rewrites.map(({ source }) => source);
  assert.ok(!rewrites.some((source) => source.startsWith("/agent.html")));
});
