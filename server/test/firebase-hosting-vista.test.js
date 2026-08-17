import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SOURCE = "/v1/vista/inspection-packages{,/**}";

/**
 * The rewrite covers the collection path and everything beneath it. The
 * sub-paths carry artifact reads (`/{runId}/artifacts/{sha256}`); with an
 * exact-path rewrite those never reach the function and Hosting answers 404
 * instead.
 */
test("hosting rewrites the VISTA package endpoint and its sub-paths to the Toronto API", () => {
  const configuration = JSON.parse(readFileSync(new URL("../../firebase.json",
    import.meta.url)));
  const rewrite = configuration.hosting.rewrites.find(({ source }) =>
    source === SOURCE);
  assert.deepEqual(rewrite, { source: SOURCE,
    function: { functionId: "api", region: "northamerica-northeast2" } });
});

test("no narrower VISTA rewrite shadows it", () => {
  const configuration = JSON.parse(readFileSync(new URL("../../firebase.json",
    import.meta.url)));
  const vista = configuration.hosting.rewrites
    .filter(({ source }) => source.startsWith("/v1/vista/inspection-packages"));
  // Hosting applies the first matching rewrite, so an exact-path entry placed
  // earlier would silently take the collection route back.
  assert.deepEqual(vista.map(({ source }) => source), [SOURCE]);
});
