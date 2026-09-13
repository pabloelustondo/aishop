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

const ADMIN_SOURCE = "/v1/admin/analyses{,/**}";

test("hosting rewrites the All-runs endpoint and its sub-paths to the same function", () => {
  const rewrite = configuration().hosting.rewrites.find(({ source }) => source === ADMIN_SOURCE);
  assert.deepEqual(rewrite, {
    source: ADMIN_SOURCE,
    function: { functionId: "api", region: "northamerica-northeast2" }
  });
  const admin = configuration().hosting.rewrites.filter(({ source }) => source.startsWith("/v1/admin"));
  assert.deepEqual(admin.map(({ source }) => source), [ADMIN_SOURCE]);
});

test("the All-runs page is served by hosting, and the listing's indexes are declared for deployment", () => {
  const config = configuration();
  assert.ok(!config.hosting.rewrites.some(({ source }) => source.startsWith("/allruns.html")));
  assert.equal(config.firestore.indexes, "firestore.indexes.json");
  const indexes = JSON.parse(readFileSync(new URL("../../firestore.indexes.json", import.meta.url)));
  // Every filter combination the reader can build has a collection-group
  // index, ordered the way the reader orders. A missing one is a 503 on TEST.
  const groups = indexes.indexes.filter((index) => index.collectionGroup === "analyses" && index.queryScope === "COLLECTION_GROUP")
    .map((index) => index.fields.map((field) => `${field.fieldPath}:${field.order}`).join(","));
  assert.deepEqual(new Set(groups), new Set([
    "ownerKey:ASCENDING,createdAt:DESCENDING",
    "status:ASCENDING,createdAt:DESCENDING",
    "ownerKey:ASCENDING,status:ASCENDING,createdAt:DESCENDING",
    "status:ASCENDING,collectionDueAt:ASCENDING"
  ]));
  const createdAt = indexes.fieldOverrides.find((override) => override.collectionGroup === "analyses" && override.fieldPath === "createdAt");
  assert.ok(createdAt.indexes.some((index) => index.queryScope === "COLLECTION_GROUP" && index.order === "DESCENDING"));
});
