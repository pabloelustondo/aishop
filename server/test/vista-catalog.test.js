import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { VISTA_CATALOG, catalogProductIds, catalogRoster } from "../src/vista-catalog.js";

test("the shipped catalog is the closed world it claims to be", () => {
  assert.equal(VISTA_CATALOG.version, "0.2.0");
  assert.equal(VISTA_CATALOG.recognitionMode, "closed_world");
  assert.equal(VISTA_CATALOG.unknownLabel, "UNKNOWN");
  assert.equal(VISTA_CATALOG.products.length, 20);
});

test("every product is identifiable and every identifier is unique", () => {
  for (const product of VISTA_CATALOG.products) {
    assert.match(product.id, /^[A-Z0-9-]+$/, `bad id: ${product.id}`);
    assert.ok(product.brand.length > 0, `no brand: ${product.id}`);
    assert.ok(product.name.length > 0, `no name: ${product.id}`);
  }
  const ids = VISTA_CATALOG.products.map((product) => product.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate product identifier");
});

test("the answer set is the catalog plus the refusal, and nothing else", () => {
  const ids = catalogProductIds();
  assert.equal(ids.length, VISTA_CATALOG.products.length + 1);
  assert.ok(ids.includes("UNKNOWN"));
});

test("the roster names each product so a reader can map a pack to an id", () => {
  const roster = catalogRoster();
  assert.equal(roster.split("\n").length, VISTA_CATALOG.products.length);
  assert.match(roster, /CER-MOI-CREMA-REPARADORA-CONTORNO — CeraVe Crema reparadora/);
});

test("the browsable copy and the server copy are the same bytes", () => {
  // Two copies exist because hosting serves static files from `dashboard/`
  // and cannot reach `server/data`. A silent divergence would let the page
  // show one catalog while recognition answers against another.
  const digest = (path) => createHash("sha256")
    .update(readFileSync(new URL(path, import.meta.url))).digest("hex");
  assert.equal(
    digest("../data/vista-catalog-cerave-ar.json"),
    digest("../../dashboard/catalog/catalog.json"),
    "dashboard/catalog/catalog.json has drifted from server/data"
  );
});

test("every catalog packshot is present for the browser to show", () => {
  const catalog = JSON.parse(readFileSync(
    new URL("../data/vista-catalog-cerave-ar.json", import.meta.url), "utf8"));
  for (const product of catalog.products) {
    const path = new URL(`../../dashboard/catalog/${product.local_image_file}`,
      import.meta.url);
    const bytes = readFileSync(path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),
      product.image_sha256, `packshot bytes differ: ${product.canonical_product_id}`);
  }
});
