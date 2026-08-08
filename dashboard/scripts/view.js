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

function reviewEvent(review) {
  const item = document.createElement("div");
  item.className = "review-event";
  item.textContent = `${review.disposition} · ${review.reviewerId}${review.notes ? ` · ${review.notes}` : ""}`;
  return item;
}
