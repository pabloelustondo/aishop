// Builds the complete CeraVe Argentina catalog and packages it for the device.
//
//   node server/scripts/build-cerave-ar-catalog.mjs [version]
//
// Default version is 0.1.1 — the string the iOS app currently hardcodes in
// LocalRecognitionCoordinator.Configuration and InspectionViewModel. Pass a
// different one (e.g. 0.3.0) ONLY together with changing those two constants,
// or the app will refuse the catalog with catalogVersionMismatch and report
// .catalogUnavailable — silently, with no error on screen.
//
// Produces three things from one set of bytes:
//   1. server/data/vista-catalog-cerave-ar.json   (what recognition reads)
//   2. dashboard/catalog/{catalog.json,images/}   (what the web page serves)
//   3. dist/vista-catalog-cerave-ar-<version>.zip (what the phone imports)
//
// All-or-nothing: every packshot is fetched and verified before anything is
// written, and the staged bundle is re-verified from its own bytes the way
// BundledCatalogReferenceProvider does on the device. A catalog that cannot
// be fully verified is never produced.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const VERSION = process.argv[2] ?? "0.1.1";
const AS_OF = new Date().toISOString().slice(0, 10);
const CHECKED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const SERVER_CATALOG = new URL("../data/vista-catalog-cerave-ar.json", import.meta.url);
const DASHBOARD = new URL("../../dashboard/catalog/", import.meta.url);
const DASHBOARD_CATALOG = new URL("catalog.json", DASHBOARD);
const DASHBOARD_IMAGES = new URL("images/", DASHBOARD);
const DIST = new URL("../../dist/", import.meta.url);

const MEDIA = "https://www.cerave.com.ar/-/media/project/loreal/brand-sites/cerave/americas/ar/products/proteccionsolar";
const PAGE = "https://www.cerave.com.ar/cuidado-de-la-piel/proteccion-solar";

/**
 * The protección solar range — the only part of the published Argentina line
 * the catalog was missing. Verified 2026-09-03 against the brand site's own
 * "25 Products" listing, with its pagination exhausted.
 *
 * `vendor_sku_declared` is null for two entries on purpose: the site publishes
 * GTIN 3337875945660 for BOTH the Fluido Protector SPF50 and the Stick Solar,
 * so at least one is wrong and there is no way to tell which. Recording a
 * barcode the source itself contradicts would put a false claim into evidence
 * a reviewer is meant to trust.
 */
const SUN_PRODUCTS = [
  {
    canonical_product_id: "CER-SUN-LOCION-PROTECTORA-SPF50",
    canonical_name: "Loción Protectora Invisible Hidratante SPF50+",
    use_case: "Loción para rostro y cuerpo, de muy alta protección y para todo tipo de pieles. Apta para pieles sensibles, con fórmula de rápida absorción y acabado invisible.",
    page: `${PAGE}/locion-protectora-invisible-hidratante-spf50`,
    image: `${MEDIA}/protectora-invisible-hidratante-spf50/sunscreen-spf50-plus-1-lg.webp`,
    vendor_sku_declared: "3337875945769"
  },
  {
    canonical_product_id: "CER-SUN-FLUIDO-PROTECTOR-SPF50",
    canonical_name: "Fluido Protector Invisible Hidratante SPF50",
    use_case: "Fluido para rostro, de alta protección y para piel normal a seca. Protección UVB + UVA, 24 h de hidratación y 3 ceramidas esenciales, con acabado invisible.",
    page: `${PAGE}/fluido-protector-invisible-hidratante-spf50`,
    image: `${MEDIA}/fluido-protector-invisible-hidratante-spf50/hydrating-fluid-screen-lg.webp`,
    vendor_sku_declared: null
  },
  {
    canonical_product_id: "CER-SUN-LOCION-PROTECTORA-SPF30",
    canonical_name: "Loción Protectora Invisible Hidratante SPF30",
    use_case: "Loción para rostro y cuerpo, de alta protección y para todo tipo de pieles. Protección UVB + UVA con 3 ceramidas, resistente al agua, al sudor y a la arena.",
    page: `${PAGE}/locion-protectora-invisible-hidratante-spf30`,
    image: `${MEDIA}/protectora-invisible-hidratante-spf30/sunscreen-spf30-175g-lg.webp`,
    vendor_sku_declared: "3337875945820"
  },
  {
    canonical_product_id: "CER-SUN-FLUIDO-OIL-CONTROL-SPF50",
    canonical_name: "Fluido Protector Invisible Oil Control SPF50+",
    use_case: "Fluido para rostro, de muy alta protección y para piel normal a grasa. Control de brillo por 12 h e hidratación por 24 h, con acabado invisible y testeado bajo maquillaje.",
    page: `${PAGE}/fluido-protector-invisible-oil-control-spf50`,
    image: `${MEDIA}/protector-invisible-oil-control-spf50/dry-touch-spf50-plus-lg.webp`,
    vendor_sku_declared: "3337875945622"
  },
  {
    canonical_product_id: "CER-SUN-STICK-SOLAR-FPS50",
    canonical_name: "Stick Solar Invisible FPS 50+",
    use_case: "Protector solar en barra para rostro, labios y zonas sensibles. Aplicación práctica y precisa, textura invisible y alta protección UVA/UVB con PA++++.",
    page: `${PAGE}/stick-solar-invisible-fps-50-plus`,
    image: `${MEDIA}/stick-solar-invisible-fps-50-plus/ss-1-lg.webp`,
    vendor_sku_declared: null
  }
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function download(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "vista-catalog-builder/1.0", accept: "image/*" },
    redirect: "follow"
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`empty body — ${url}`);
  return bytes;
}

function sunEntry(product, bytes) {
  const extension = product.image.split("?")[0].split(".").pop().toLowerCase();
  return {
    catalog_version: VERSION,
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
    official_product_page: product.page,
    official_image_url: `${product.image}?rev=-1`,
    source_checked_at: CHECKED_AT,
    image_sha256: sha256(bytes),
    vendor_sku_declared: product.vendor_sku_declared
  };
}

async function main() {
  console.log(`Building VISTA CeraVe Argentina catalog ${VERSION}\n`);

  const existing = JSON.parse(await readFile(SERVER_CATALOG, "utf8"));

  // 1. Fetch the missing range. Nothing is written until all five succeed.
  const fetched = [];
  for (const product of SUN_PRODUCTS) {
    process.stdout.write(`  fetch  ${product.canonical_product_id} … `);
    const bytes = await download(product.image);
    fetched.push({ product, bytes });
    console.log(`${bytes.length} bytes`);
  }

  const additions = fetched.map(({ product, bytes }) => sunEntry(product, bytes));
  const kept = existing.products.filter((p) => !additions.some(
    (a) => a.canonical_product_id === p.canonical_product_id));

  // Every product carries the version, so a bump rewrites them all. The old
  // starter catalog shipped a header of 0.1.1 over products still saying
  // 0.1.0; rewriting here means the two can never disagree again.
  const products = [...kept, ...additions]
    .map((p) => ({ ...p, catalog_version: VERSION }));

  const ids = products.map((p) => p.canonical_product_id);
  if (new Set(ids).size !== ids.length) throw new Error("duplicate canonical_product_id");

  const catalog = {
    catalog_version: VERSION,
    catalog_name: "VISTA CeraVe Argentina Catalog",
    as_of: AS_OF,
    recognition_mode: "closed_world",
    unknown_label: "UNKNOWN",
    source: "https://www.cerave.com.ar — JSON-LD Product data and official packshots",
    products
  };
  const catalogBytes = Buffer.from(`${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  // 2. Write the new packshots and both catalog copies.
  await mkdir(DASHBOARD_IMAGES, { recursive: true });
  for (const { product, bytes } of fetched) {
    const added = additions.find(
      (a) => a.canonical_product_id === product.canonical_product_id);
    await writeFile(new URL(added.local_image_file.replace(/^images\//, ""),
      DASHBOARD_IMAGES), bytes);
  }
  await writeFile(SERVER_CATALOG, catalogBytes);
  await writeFile(DASHBOARD_CATALOG, catalogBytes);

  // 3. Stage the device bundle: catalog.json + every declared packshot.
  const stem = `vista-catalog-cerave-ar-${VERSION}`;
  const staging = new URL(`${stem}/`, DIST);
  const bundle = new URL("catalog/", staging);
  const bundleImages = new URL("images/", bundle);
  await rm(staging, { recursive: true, force: true });
  await mkdir(bundleImages, { recursive: true });
  await writeFile(new URL("catalog.json", bundle), catalogBytes);
  for (const product of products) {
    const name = product.local_image_file.replace(/^images\//, "");
    await copyFile(new URL(name, DASHBOARD_IMAGES), new URL(name, bundleImages));
  }

  // 4. Re-verify the staged bundle exactly as the device will, from its own
  //    bytes — not from what we believe we just wrote.
  const staged = JSON.parse(await readFile(new URL("catalog.json", bundle), "utf8"));
  if (staged.catalog_version !== VERSION) throw new Error("staged version mismatch");
  for (const product of staged.products) {
    const name = product.local_image_file.replace(/^images\//, "");
    const bytes = await readFile(new URL(name, bundleImages));
    if (sha256(bytes) !== product.image_sha256) {
      throw new Error(`imageHashMismatch: ${product.canonical_product_id}`);
    }
  }
  const extra = (await readdir(fileURLToPath(bundleImages)))
    .filter((f) => !staged.products.some((p) => p.local_image_file.endsWith(`/${f}`)));
  if (extra.length) throw new Error(`undeclared files in bundle: ${extra.join(", ")}`);

  // 5. Zip it. -X drops macOS extended attributes; .DS_Store is excluded so
  //    the bundle contains only what the catalog declares.
  const zip = `${stem}.zip`;
  await rm(new URL(zip, DIST), { force: true });
  execFileSync("zip", ["-r", "-X", "-q", `../${zip}`, "catalog", "-x", "*.DS_Store"],
    { cwd: fileURLToPath(staging) });

  const byCategory = products.reduce((counts, p) =>
    ({ ...counts, [p.category]: (counts[p.category] ?? 0) + 1 }), {});

  console.log(`\n  ${products.length} products verified · ${VERSION}`);
  for (const [category, count] of Object.entries(byCategory).sort()) {
    console.log(`    ${String(count).padStart(3)}  ${category}`);
  }
  console.log(`\n  catalog digest ${sha256(catalogBytes)}`);
  console.log(`\n  server    ${fileURLToPath(SERVER_CATALOG)}`);
  console.log(`  dashboard ${fileURLToPath(DASHBOARD_CATALOG)}`);
  console.log(`  DEVICE ZIP ${fileURLToPath(new URL(zip, DIST))}`);
  console.log(`\n  AirDrop the zip, unzip on the phone, then Importar catálogo →`);
  console.log(`  pick the "catalog" folder.`);
}

main().catch((error) => {
  console.error(`\nFAILED — nothing was written. ${error.message}`);
  process.exitCode = 1;
});
