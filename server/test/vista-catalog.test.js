import assert from "node:assert/strict";
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
