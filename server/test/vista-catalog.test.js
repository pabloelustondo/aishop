import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { VISTA_CATALOG, catalogProductIds, catalogRoster } from "../src/vista-catalog.js";

test("the shipped catalog is the closed world it claims to be", () => {
  // MUST equal the version the iOS app asks for — the literal in
  // LocalRecognitionCoordinator.Configuration.init and the one in
  // InspectionViewModel. The app refuses any other version with
  // catalogVersionMismatch and then reports .catalogUnavailable, which shows
  // up as recognition finding nothing rather than as an error. Publishing
  // 0.2.0 against an app pinned to 0.1.1 is exactly how that happened before.
  assert.equal(VISTA_CATALOG.version, "0.1.1");
  assert.equal(VISTA_CATALOG.recognitionMode, "closed_world");
  assert.equal(VISTA_CATALOG.unknownLabel, "UNKNOWN");
  assert.equal(VISTA_CATALOG.products.length, 5);
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

test("the catalog is exactly the five units the in-house demo uses", () => {
  // Deliberately small. Recognition matches printed text against
  // canonical_name (appearance descriptors are off, S10.10), so a closed world
  // of five physically present units is the honest scope for this demo — not a
  // brand range whose packs are not in the room.
  assert.deepEqual(VISTA_CATALOG.products.map((product) => product.id).sort(), [
    "CER-MOI-CREAM-340",
    "CER-MOI-EYE-REPAIR-14",
    "CER-MOI-FACIAL-AM-52",
    "CER-MOI-INTENSIVA-236",
    "CER-MOI-LOTION-236"
  ]);
});

test("the answer set is the catalog plus the refusal, and nothing else", () => {
  const ids = catalogProductIds();
  assert.equal(ids.length, VISTA_CATALOG.products.length + 1);
  assert.ok(ids.includes("UNKNOWN"));
});

test("the roster names each product so a reader can map a pack to an id", () => {
  const roster = catalogRoster();
  assert.equal(roster.split("\n").length, VISTA_CATALOG.products.length);
  assert.match(roster, /CER-MOI-LOTION-236 — CeraVe Moisturising Lotion Sin Perfume/);
});

test("no word appears in two catalog names", () => {
  // The device scores identification by text F1 against `canonical_name`, and
  // `genericDocumentFrequencyRatio: 0.30` drops any word carried by 30% of the
  // roster. Over five products that is any word used twice — so a shared word
  // is not merely redundant, it is discarded, and two products that share most
  // of their name become mutually indistinguishable. Names are chosen to be
  // maximally separable, not to be faithful transcriptions of the carton.
  const seen = new Map();
  for (const product of VISTA_CATALOG.products) {
    for (const word of product.name.toLowerCase().split(/[^\p{L}\p{N}-]+/u).filter(Boolean)) {
      const owner = seen.get(word);
      assert.equal(
        owner ?? product.id,
        product.id,
        `"${word}" appears in both ${owner} and ${product.id}; rename one`
      );
      seen.set(word, product.id);
    }
  }
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
