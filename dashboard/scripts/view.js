const byId = (id) => document.getElementById(id);
let evidenceUrl;

export function message(text) { byId("message").textContent = text; }
export function showSession(user) {
  byId("signed-out").hidden = Boolean(user);
  byId("dashboard").hidden = !user;
  byId("sign-out").hidden = !user;
}

function scanButton(scan, select) {
  const button = document.createElement("button");
  button.className = "scan-item";
  const title = document.createElement("strong");
  title.textContent = scan.mode === "areaScan" ? "Area scan" : "Target product";
  const detail = document.createElement("span");
  detail.textContent = `${scan.status ?? "unknown"} · ${scan.scanId.slice(0, 8)}`;
  button.append(title, detail);
  button.addEventListener("click", () => select(scan.scanId));
  return button;
}

export function renderLists(data, select) {
  for (const [key, id] of [["pending", "pending-list"], ["recent", "recent-list"]]) {
    const list = byId(id);
    list.replaceChildren(...data[key].map((scan) => scanButton(scan, select)));
    if (!data[key].length) list.textContent = "No inspections";
  }
}

export function renderDetail(detail, evidenceBlob) {
  byId("empty-state").hidden = true;
  byId("inspection").hidden = false;
  byId("status").textContent = detail.status;
  byId("scan-title").textContent = detail.mode === "areaScan" ? "Area scan" : "Target product";
  byId("metadata").textContent = `${detail.appVersion} · ${detail.scanId}`;
  byId("findings").textContent = JSON.stringify(detail.initialFindings, null, 2);
  byId("review-history").replaceChildren(...(detail.reviews ?? []).map(reviewEvent));
  if (evidenceUrl) URL.revokeObjectURL(evidenceUrl);
  evidenceUrl = URL.createObjectURL(evidenceBlob);
  byId("evidence-image").src = evidenceUrl;
  byId("original-link").href = evidenceUrl;
}

// MARK: - VISTA packages

let vistaUrls = [];

/**
 * Receipts are stamped in UTC. Read from Argentina that puts a 21:56 package
 * on the next day at 00:56, so the list shows the viewer's own zone. The run
 * ID and the exact UTC stamp stay in the detail pane for cross-referencing
 * the audit chain.
 */
const RECEIVED_AT = new Intl.DateTimeFormat(undefined, {
  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false
});

function receivedLabel(receivedAt) {
  if (!receivedAt) return "no receipt time";
  const at = new Date(receivedAt);
  return Number.isNaN(at.getTime()) ? receivedAt : RECEIVED_AT.format(at);
}

export function renderVistaList(data, select) {
  const list = byId("vista-list");
  // The query carries no ordering, so documents arrive in run-ID order, which
  // reads as random. Sorted here rather than in Firestore because `orderBy` on
  // a collection group needs a composite index this endpoint deliberately avoids.
  const runs = [...(data.runs ?? [])].sort((a, b) =>
    String(b.receivedAt ?? "").localeCompare(String(a.receivedAt ?? "")));
  list.replaceChildren(...runs.map((run, index) => {
    const button = document.createElement("button");
    button.className = "scan-item";
    const title = document.createElement("strong");
    const images = run.artifacts.filter((a) => a.kind.startsWith("image/")).length;
    title.textContent = `${receivedLabel(run.receivedAt)} · ${images} photo${
      images === 1 ? "" : "s"}`;
    const detail = document.createElement("span");
    detail.textContent = `${index === 0 ? "latest · " : ""}${
      run.status ?? "unknown"} · ${run.runId.slice(0, 8)}`;
    button.append(title, detail);
    button.addEventListener("click", () => select(run));
    return button;
  }));
  if (!runs.length) list.textContent = "No packages";
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/** A definition list, skipping nothing: a missing value shows as a dash. */
function facts(pairs) {
  const list = el("dl", "facts");
  for (const [term, value] of pairs) {
    list.append(el("dt", null, term), el("dd", null, value ?? "—"));
  }
  return list;
}

const millis = (v) =>
  v == null ? null : `${Math.round(Number(v)).toLocaleString()} ms`;

/**
 * What the device itself reported, read only from the chain it sealed. Nothing
 * here is inferred: a field the run never recorded stays absent rather than
 * being filled with a plausible number.
 */
function readIphoneReport(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return null;
  const events = chain.map((entry) => entry.event).filter(Boolean);
  const find = (name) => events.find((e) => e.name === name);
  const identified = find("recognition.identified");
  const attempted = find("recognition.attempted");
  const shown = find("results.shown");
  const coverage = [...events].reverse().find((e) => e.name === "coverage.updated");

  const rows = [];
  for (const [key, value] of Object.entries(shown?.payload ?? {})) {
    if (key.startsWith("row.")) rows.push(String(value));
  }

  return {
    rows,
    unavailable: find("recognition.unavailable")?.payload?.reason ?? null,
    warnings: events.filter((e) => e.severity && e.severity !== "info").length,
    facts: [
      ["facings", identified?.payload?.totalFacings],
      ["named / unknown", identified
        ? `${identified.payload.namedRows} / ${identified.payload.unknownRows}` : null],
      ["coverage", coverage ? `${Math.round(coverage.payload.after * 100)}%` : null],
      ["SAM 3", millis(identified?.payload?.["ms.sam3Segment"])],
      ["vision", millis(identified?.payload?.["ms.visionTotal"])],
      ["feature prints", identified?.payload?.["ms.visionFeaturePrintCount"]],
      ["model prepare", millis(find("recognition.modelPrepared")?.payload?.prepareMs)],
      ["pipeline", identified?.payload?.pipelineID ?? attempted?.payload?.pipelineID],
      ["catalog", identified?.payload?.catalogVersion
        ?? events[0]?.versions?.catalog],
      ["model stamp", events[0]?.versions?.model],
      ["events", events.length]
    ]
  };
}

function photoCell(artifact, blob) {
  const cell = el("div", "cell photo");
  if (blob) {
    const url = URL.createObjectURL(blob);
    vistaUrls.push(url);
    const image = el("img");
    image.src = url;
    image.alt = `${artifact.kind} capture`;
    cell.append(image);
  } else {
    cell.append(el("p", "cell-none", "bytes unavailable"));
  }
  cell.append(facts([
    ["kind", artifact.kind.replace("image/", "")],
    ["bytes", Number(artifact.byteCount).toLocaleString()],
    ["sha256", `${artifact.sha256.slice(0, 20)}…`]
  ]));
  return cell;
}

function iphoneCell(report) {
  const cell = el("div", "cell");
  if (!report) {
    cell.append(el("p", "cell-none", "no audit chain in this package"));
    return cell;
  }
  if (report.rows.length) {
    const list = el("ul", "cell-rows");
    for (const row of report.rows) list.append(el("li", null, row));
    cell.append(list);
  } else {
    cell.append(el("p", "cell-none", report.unavailable
      ? `refused · ${report.unavailable}` : "no rows reported"));
  }
  cell.append(facts(report.facts));
  if (report.warnings) {
    cell.append(el("p", "cell-warn", `${report.warnings} events above info`));
  }
  return cell;
}

/**
 * What server recognition saw in this capture.
 *
 * Open world in this increment: the model names whatever is on the shelf,
 * including products no catalog knows. Those answers are what a catalog gets
 * built from — so a name here is an observation, not a match, and the cell
 * says so rather than implying the two columns are comparable yet.
 */
function gptCell(run, artifact, onAnalyze) {
  const cell = el("div", "cell");
  const finding = run.analysis?.photos?.[artifact.sha256];

  if (!finding) {
    cell.append(el("p", "cell-none", "not analysed"));
    const button = el("button", "cell-action", "Analyse this photo");
    button.addEventListener("click", () => onAnalyze(artifact.sha256, button));
    cell.append(button);
    return cell;
  }

  const report = finding.report ?? {};
  if (report.summary) cell.append(el("p", "cell-summary", report.summary));

  const products = report.identifiedProducts ?? [];
  if (products.length) {
    const list = el("ul", "cell-rows");
    for (const product of products) {
      list.append(el("li", null, `${product.name} · ${product.confidence}`));
    }
    cell.append(list);
  } else {
    cell.append(el("p", "cell-none", "nothing identified"));
  }

  const uncertain = report.uncertainItems ?? [];
  if (uncertain.length) {
    const list = el("ul", "cell-rows");
    for (const item of uncertain) list.append(el("li", null, item.description));
    cell.append(el("p", "cell-hint", "uncertain"), list);
  }

  cell.append(facts([
    ["model", finding.model],
    ["catalog", finding.catalogVersion ?? "open world"],
    ["analysed", receivedLabel(finding.analyzedAt)]
  ]));
  return cell;
}

function humanCell() {
  const cell = el("div", "cell");
  cell.append(el("p", "cell-none", "no disposition"));
  cell.append(el("p", "cell-hint", "reviewer decision lands here"));
  return cell;
}

/**
 * Shows what the server actually holds for one package: its receipt, the
 * hashes that bind it to the device's sealed run, and one row per photograph —
 * the capture, what the device concluded from it, what server recognition
 * found, and what a reviewer decided.
 */
export function renderVistaDetail(run, blobs, chain, onAnalyze) {
  byId("empty-state").hidden = true;
  byId("inspection").hidden = true;
  byId("vista-detail").hidden = false;

  byId("vista-title").textContent = `Run ${run.runId.slice(0, 8)}`;
  byId("vista-status").textContent = run.status ?? "unknown";
  byId("vista-meta").textContent =
    `${receivedLabel(run.receivedAt)} · ${run.receivedAt ?? "—"} · receipt ${run.receiptId ?? "—"}`;
  byId("vista-chain").textContent = run.terminalChainHash ?? "—";

  for (const url of vistaUrls) URL.revokeObjectURL(url);
  vistaUrls = [];

  const report = readIphoneReport(chain);
  const photos = run.artifacts.filter((a) => a.kind.startsWith("image/"));
  const grid = byId("vista-gallery");
  grid.replaceChildren(
    el("div", "cell-head", "Photo"),
    el("div", "cell-head", "iPhone report"),
    el("div", "cell-head", "GPT finds"),
    el("div", "cell-head", "Human report"),
    ...photos.flatMap((artifact) => [
      photoCell(artifact, blobs.get(artifact.sha256)),
      iphoneCell(report),
      gptCell(run, artifact, onAnalyze),
      humanCell()
    ])
  );
  if (!photos.length) grid.replaceChildren(el("p", "cell-none", "no captures in this package"));
}

function reviewEvent(review) {
  const item = document.createElement("div");
  item.className = "review-event";
  item.textContent = `${review.disposition} · ${review.reviewerId}${review.notes ? ` · ${review.notes}` : ""}`;
  return item;
}
