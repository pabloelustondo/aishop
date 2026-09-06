// Adds the CeraVe Argentina sun-protection range to the VISTA catalog.
//
// Run from anywhere:  node server/scripts/add-sun-protection-catalog.mjs
//
// Needs real internet, so it runs on a developer machine rather than in CI.
// All-or-nothing by construction: every packshot is downloaded and hashed
// before a single file is written, and a failure leaves the repository
// exactly as it was. That mirrors the device's own import rule — a catalog
// that cannot be fully verified is never installed.
//
// The two catalog copies (server/data + dashboard/catalog) are written from
// the same bytes, because `vista-catalog.test.js` asserts they are identical
// and hosting cannot reach server/data.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CATALOG_VERSION = "0.3.0";
const AS_OF = new Date().toISOString().slice(0, 10);
const CHECKED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const SERVER_CATALOG = new URL("../data/vista-catalog-cerave-ar.json", import.meta.url);
const DASHBOARD_CATALOG = new URL("../../dashboard/catalog/catalog.json", import.meta.url);
const DASHBOARD_IMAGES = new URL("../../dashboard/catalog/images/", import.meta.url);

const BASE = "https://www.cerave.com.ar/-/media/project/loreal/brand-sites/cerave/americas/ar/products/proteccionsolar";
const PAGE = "https://www.cerave.com.ar/cuidado-de-la-piel/proteccion-solar";

/**
 * The range as the manufacturer's own site publishes it (checked 2026-09-03).
 *
 * `vendor_sku_declared` comes from the listing page's ItemList JSON-LD.
 * Two entries are null on purpose: the site publishes GTIN 3337875945660 for
 * BOTH the Fluido Protector SPF50 and the Stick Solar, so at least one is
 * wrong and there is no way to tell which. The site does this elsewhere too
 * (3606000537699 is claimed by both the Limpiador Facial Hidratante and the
 * Crema Reparadora de Manos). Null is the honest answer; recording a barcode
 * known to be contradicted would put a false claim into evidence a reviewer
 * is meant to trust.
 */
const PRODUCTS = [
  {
    canonical_product_id: "CER-SUN-LOCION-PROTECTORA-SPF50",
    vendor_sku_declared: "3337875945769",
    canonical_name: "Loción Protectora Invisible Hidratante SPF50+",
    use_case: "Loción para rostro y cuerpo, de muy alta protección y para todo tipo de pieles. Apta para pieles sensibles, con una fórmula de rápida absorción y acabado invisible.",
    official_product_page: `${PAGE}/locion-protectora-invisible-hidratante-spf50`,
    image: `${BASE}/protectora-invisible-hidratante-spf50/sunscreen-spf50-plus-1-lg.webp`
  },
  {
    canonical_product_id: "CER-SUN-FLUIDO-PROTECTOR-SPF50",
    vendor_sku_declared: null,
    canonical_name: "Fluido Protector Invisible Hidratante SPF50",
    use_case: "Fluido para rostro, de alta protección y para piel normal a seca. Protección UVB + UVA, 24 h de hidratación y 3 ceramidas esenciales, con acabado invisible.",
    official_product_page: `${PAGE}/fluido-protector-invisible-hidratante-spf50`,
    image: `${BASE}/fluido-protector-invisible-hidratante-spf50/hydrating-fluid-screen-lg.webp`
  },
  {
    canonical_product_id: "CER-SUN-LOCION-PROTECTORA-SPF30",
    vendor_sku_declared: "3337875945820",
    canonical_name: "Loción Protectora Invisible Hidratante SPF30",
    use_case: "Loción para rostro y cuerpo, de alta protección y para todo tipo de pieles. Protección UVB + UVA con 3 ceramidas, resistente al agua, al sudor y a la arena.",
    official_product_page: `${PAGE}/locion-protectora-invisible-hidratante-spf30`,
    image: `${BASE}/protectora-invisible-hidratante-spf30/sunscreen-spf30-175g-lg.webp`
  },
  {
    canonical_product_id: "CER-SUN-FLUIDO-OIL-CONTROL-SPF50",
    vendor_sku_declared: "3337875945622",
    canonical_name: "Fluido Protector Invisible Oil Control SPF50+",
    use_case: "Fluido para rostro, de muy alta protección y para piel normal a grasa. Control de brillo por 12 h e hidratación por 24 h, con acabado invisible y testeado bajo maquillaje.",
    official_product_page: `${PAGE}/fluido-protector-invisible-oil-control-spf50`,
    image: `${BASE}/protector-invisible-oil-control-spf50/dry-touch-spf50-plus-lg.webp`
  },
  {
    canonical_product_id: "CER-SUN-STICK-SOLAR-FPS50",
    vendor_sku_declared: null,
    canonical_name: "Stick Solar Invisible FPS 50+",
    use_case: "Protector solar en barra para rostro, labios y zonas sensibles. Aplicación práctica y precisa, textura invisible y alta protección UVA/UVB con PA++++.",
    official_product_page: `${PAGE}/stick-solar-invisible-fps-50-plus`,
    image: `${BASE}/stick-solar-invisible-fps-50-plus/ss-1-lg.webp`
  }
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function download(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "vista-catalog-builder/1.0", accept: "image/*" },
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`empty body for ${url}`);
  return bytes;
}

function entry(product, bytes) {
  const extension = product.image.split("?")[0].split(".").pop().toLowerCase();
  return {
    catalog_version: CATALOG_VERSION,
    canonical_product_id: product.canonical_product_id,
    counting_key: product.canonical_product_id,
    brand: "CeraVe",
    canonical_name: product.canonical_name,
    category: "Protección solar",
    use_case: product.use_case,
    reference_market: "AR",
    confirmed_markets: ["AR"],
    local_image_file: `images/${product.canonical_product_id}.${extension}`,
    image_status: "downloaded_official_reference",
    official_product_page: product.official_product_page,
    official_image_url: `${product.image}?rev=-1`,
    source_checked_at: CHECKED_AT,
    image_sha256: sha256(bytes),
    vendor_sku_declared: product.vendor_sku_declared
  };
}

async function main() {
  const catalog = JSON.parse(await readFile(SERVER_CATALOG, "utf8"));

  // Download everything first. Nothing is written until all five succeed.
  const downloaded = [];
  for (const product of PRODUCTS) {
    process.stdout.write(`  fetching ${product.canonical_product_id} … `);
    const bytes = await download(product.image);
    downloaded.push({ product, bytes });
    console.log(`${bytes.length} bytes`);
  }

  const additions = downloaded.map(({ product, bytes }) => entry(product, bytes));
  const kept = catalog.products.filter(
    (existing) => !additions.some((added) =>
      added.canonical_product_id === existing.canonical_product_id)
  );

  // Every product carries the catalog version, so a bump rewrites them all.
  const products = [...kept, ...additions]
    .map((product) => ({ ...product, catalog_version: CATALOG_VERSION }));

  const ids = products.map((product) => product.canonical_product_id);
  if (new Set(ids).size !== ids.length) throw new Error("duplicate canonical_product_id");

  const updated = {
    ...catalog,
    catalog_version: CATALOG_VERSION,
    as_of: AS_OF,
    products
  };
  const bytes = Buffer.from(`${JSON.stringify(updated, null, 2)}\n`, "utf8");

  await mkdir(DASHBOARD_IMAGES, { recursive: true });
  for (const { product, bytes: image } of downloaded) {
    const added = additions.find(
      (candidate) => candidate.canonical_product_id === product.canonical_product_id
    );
    const name = added.local_image_file.replace(/^images\//, "");
    await writeFile(new URL(name, DASHBOARD_IMAGES), image);
  }
  // Identical bytes to both copies: the test compares their digests.
  await writeFile(SERVER_CATALOG, bytes);
  await writeFile(DASHBOARD_CATALOG, bytes);

  console.log(`\ncatalog ${CATALOG_VERSION} · ${products.length} products `
    + `(+${additions.length} protección solar)`);
  console.log(`digest ${sha256(bytes)}`);
  console.log(`\nwrote ${fileURLToPath(SERVER_CATALOG)}`);
  console.log(`wrote ${fileURLToPath(DASHBOARD_CATALOG)}`);
}

main().catch((error) => {
  console.error(`\nFAILED — nothing was written. ${error.message}`);
  process.exitCode = 1;
});
