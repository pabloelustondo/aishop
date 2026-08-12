import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("hosting rewrites the exact VISTA package endpoint to the Toronto API", () => {
  const configuration = JSON.parse(readFileSync(new URL("../../firebase.json",
    import.meta.url)));
  const rewrite = configuration.hosting.rewrites.find(({ source }) =>
    source === "/v1/vista/inspection-packages");
  assert.deepEqual(rewrite, { source: "/v1/vista/inspection-packages",
    function: { functionId: "api", region: "northamerica-northeast2" } });
});
