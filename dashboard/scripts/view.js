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

export function renderVistaList(data, select) {
  const list = byId("vista-list");
  const runs = data.runs ?? [];
  list.replaceChildren(...runs.map((run) => {
    const button = document.createElement("button");
    button.className = "scan-item";
    const title = document.createElement("strong");
    const images = run.artifacts.filter((a) => a.kind.startsWith("image/")).length;
    title.textContent = `${images} photo${images === 1 ? "" : "s"}`;
    const detail = document.createElement("span");
    detail.textContent = `${run.status ?? "unknown"} · ${run.runId.slice(0, 8)}`;
    button.append(title, detail);
    button.addEventListener("click", () => select(run));
    return button;
  }));
  if (!runs.length) list.textContent = "No packages";
}

/**
 * Shows what the server actually holds for one package: its receipt, the
 * hashes that bind it to the device's sealed run, and every capture.
 */
export function renderVistaDetail(run, blobs) {
  byId("empty-state").hidden = true;
  byId("inspection").hidden = true;
  byId("vista-detail").hidden = false;

  byId("vista-title").textContent = `Run ${run.runId.slice(0, 8)}`;
  byId("vista-status").textContent = run.status ?? "unknown";
  byId("vista-meta").textContent =
    `${run.receivedAt ?? "—"} · receipt ${run.receiptId ?? "—"}`;
  byId("vista-chain").textContent = run.terminalChainHash ?? "—";

  for (const url of vistaUrls) URL.revokeObjectURL(url);
  vistaUrls = [];

  const gallery = byId("vista-gallery");
  gallery.replaceChildren(...run.artifacts.map((artifact) => {
    const figure = document.createElement("figure");
    const blob = blobs.get(artifact.sha256);
    if (artifact.kind.startsWith("image/") && blob) {
      const url = URL.createObjectURL(blob);
      vistaUrls.push(url);
      const image = document.createElement("img");
      image.src = url;
      image.alt = `${artifact.kind} capture`;
      figure.append(image);
    }
    const caption = document.createElement("figcaption");
    caption.textContent =
      `${artifact.kind} · ${Number(artifact.byteCount).toLocaleString()} bytes`;
    const hash = document.createElement("code");
    hash.textContent = artifact.sha256.slice(0, 16) + "…";
    figure.append(caption, hash);
    return figure;
  }));
}

function reviewEvent(review) {
  const item = document.createElement("div");
  item.className = "review-event";
  item.textContent = `${review.disposition} · ${review.reviewerId}${review.notes ? ` · ${review.notes}` : ""}`;
  return item;
}
