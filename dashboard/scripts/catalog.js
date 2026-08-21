// The catalog a run is counted against, product by product.
//
// Served as static files rather than through the API: this is public product
// data lifted from the manufacturer's own site, it needs no reviewer identity
// to read, and the folder mirrors the layout the device imports — so every
// `local_image_file` in the catalog resolves here without rewriting a path.

const byId = (id) => document.getElementById(id);
const message = (text) => { byId("message").textContent = text; };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function facts(pairs) {
  const list = byId("product-facts");
  list.replaceChildren();
  for (const [term, value, href] of pairs) {
    if (value == null || value === "") continue;
    list.append(el("dt", null, term));
    const definition = el("dd");
    if (href) {
      const link = el("a", null, value);
      link.href = href;
      link.rel = "noreferrer";
      link.target = "_blank";
      definition.append(link);
    } else {
      definition.textContent = value;
    }
    list.append(definition);
  }
}

function show(product) {
  byId("empty-state").hidden = true;
  byId("product").hidden = false;

  byId("product-brand").textContent = product.brand;
  byId("product-name").textContent = product.canonical_name;
  byId("product-id").textContent = product.canonical_product_id;

  const image = byId("product-image");
  image.src = `/catalog/${product.local_image_file}`;
  image.alt = `${product.brand} ${product.canonical_name} packshot`;
  byId("product-image-note").textContent =
    "Official packshot. These exact bytes are what the device verifies on import.";

  byId("product-description").textContent =
    product.use_case || "No description published for this product.";

  facts([
    ["category", product.category],
    ["counting key", product.counting_key],
    ["market", [product.reference_market, ...(product.confirmed_markets ?? [])]
      .filter((market, index, all) => market && all.indexOf(market) === index)
      .join(" · ")],
    ["vendor SKU", product.vendor_sku_declared],
    ["image sha256", product.image_sha256],
    ["source", "official product page", product.official_product_page]
  ]);

  for (const button of document.querySelectorAll("#product-list button")) {
    button.classList.toggle("selected",
      button.dataset.product === product.canonical_product_id);
  }
}

function renderList(products) {
  byId("product-list").replaceChildren(...products.map((product) => {
    const button = el("button", "scan-item");
    button.dataset.product = product.canonical_product_id;
    button.append(
      el("strong", null, product.canonical_name),
      el("span", null, `${product.category ?? "—"} · ${product.canonical_product_id}`)
    );
    button.addEventListener("click", () => show(product));
    return button;
  }));
}

try {
  const response = await fetch("/catalog/catalog.json");
  if (!response.ok) throw new Error(`Catalog unavailable (${response.status}).`);
  const catalog = await response.json();

  // Grouped by category, then by name: a reviewer looking for a product knows
  // what kind of thing it is long before they remember its identifier.
  const products = [...catalog.products].sort((a, b) =>
    (a.category ?? "").localeCompare(b.category ?? "")
    || a.canonical_name.localeCompare(b.canonical_name));

  byId("catalog-title").textContent = catalog.catalog_name ?? "Catalog";
  byId("catalog-count").textContent =
    `${products.length} · v${catalog.catalog_version}`;
  renderList(products);
  message("");
} catch (error) {
  message(error.message);
}
