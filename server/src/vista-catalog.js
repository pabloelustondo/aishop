import { readFileSync } from "node:fs";

/**
 * The product catalog a VISTA run is counted against.
 *
 * Byte-identical to the file the device imports, so the same digest describes
 * both copies and a disagreement between the two sides can be settled by
 * comparing hashes rather than by argument.
 *
 * Shipped as a file rather than held in Firestore because it is versioned with
 * the code that reads it and changes on the same cadence as a release. When
 * catalogs start changing between releases — a new market, a seasonal range —
 * that argument stops holding and it should move to a collection.
 */
const catalog = JSON.parse(readFileSync(
  new URL("../data/vista-catalog-cerave-ar.json", import.meta.url), "utf8"
));

export const VISTA_CATALOG = Object.freeze({
  version: catalog.catalog_version,
  name: catalog.catalog_name,
  recognitionMode: catalog.recognition_mode,
  unknownLabel: catalog.unknown_label,
  products: Object.freeze(catalog.products.map((product) => Object.freeze({
    id: product.canonical_product_id,
    brand: product.brand,
    name: product.canonical_name,
    category: product.category ?? null
  })))
});

/** Every identifier a closed-world answer may use, plus the refusal. */
export function catalogProductIds() {
  return [...VISTA_CATALOG.products.map((product) => product.id),
    VISTA_CATALOG.unknownLabel];
}

/**
 * The catalog as a model reads it. Identifiers alone are not enough — the
 * model has to map what is printed on a pack to one of them, and only the
 * brand and name carry that.
 */
export function catalogRoster() {
  return VISTA_CATALOG.products
    .map((product) => `  ${product.id} — ${product.brand} ${product.name}`)
    .join("\n");
}
