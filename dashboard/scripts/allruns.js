/**
 * The All-runs page: every saved agent analysis, from every owner, read-only.
 *
 * It is a separate page from My runs on purpose. My runs is an uploader's
 * own history with buttons that spend money; this page has no button that
 * changes anything, and it is reached only by an account carrying the admin
 * authorization. Hiding the link on My runs is a courtesy; the server is the
 * gate. The two decisions worth testing without a browser — how filters
 * become a query string, and how an attempt is described — are exported.
 */

const BASE = "/v1/admin/analyses";
const STATUSES = ["uploaded", "analyzing", "analyzed", "failed"];
export const OBSERVATION_INTERVAL_MS = 15_000;
export const OBSERVATION_CEILING_MS = 10 * 60_000;

export function shouldPollAnalyses(analyses, { visible = true,
  elapsedMs = 0 } = {}) {
  return visible && elapsedMs < OBSERVATION_CEILING_MS
    && Array.isArray(analyses)
    && analyses.some(analysis => analysis?.status === "analyzing");
}

const element = (id) => (typeof document === "undefined" ? null : document.getElementById(id));
const view = {
  signedOut: element("signed-out"), notAuthorized: element("not-authorized"), main: element("allruns"),
  signIn: element("sign-in"), signOut: element("sign-out"),
  emailForm: element("email-form"), email: element("email"), password: element("password"),
  emailSignIn: element("email-sign-in"), forgot: element("forgot"),
  filters: element("filters"), owner: element("owner"), status: element("status"),
  from: element("from"), to: element("to"), limit: element("limit"), clear: element("clear"),
  rows: element("rows"), empty: element("empty"), count: element("count"),
  previous: element("previous"), next: element("next"), message: element("message")
};

/** Pure. Only filters with a value travel; an empty field is not a filter. */
export function queryString({ owner, status, from, to, limit, cursor } = {}) {
  const parameters = new URLSearchParams();
  for (const [name, value] of Object.entries({ owner, status, from, to, limit, cursor })) {
    const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value);
    if (text !== "") parameters.set(name, text);
  }
  const encoded = parameters.toString();
  return encoded ? `?${encoded}` : "";
}

/** Pure. One attempt, said the way the run history says it. */
export function attemptLine(run, index = 0) {
  const number = run?.runNumber ?? index + 1;
  const asked = run?.context ? `“${run.context}”` : (index === 0 ? "no note — initial run" : "no note");
  const outcome = [run?.status, run?.failureReason].filter(Boolean).join(" · ") || "status unavailable";
  return { number: `Run ${number}`, asked, outcome };
}

/** Pure. What the owner column shows. */
export function ownerText(owner) {
  if (owner?.label) return owner.label;
  if (owner?.kind === "anonymous") return "anonymous account";
  return "unresolved owner";
}

export function signInErrorMessage(code) {
  switch (code) {
    case "auth/invalid-email": case "auth/missing-email": return "Enter the email address of your account.";
    case "auth/missing-password": return "Enter your password.";
    case "auth/user-not-found": case "auth/wrong-password":
    case "auth/invalid-credential": case "auth/invalid-login-credentials": return "The email or password is not right.";
    case "auth/too-many-requests": return "Too many attempts. Wait a few minutes, then try again.";
    case "auth/user-disabled": return "This account has been disabled.";
    case "auth/network-request-failed": return "The sign-in service could not be reached. Check your connection.";
    case "auth/popup-closed-by-user": case "auth/cancelled-popup-request": return "The sign-in window was closed before finishing.";
    default: return "Sign-in did not complete. Try again.";
  }
}
const popupFailed = (code) => ["auth/popup-blocked", "auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(code);

// --- state ------------------------------------------------------------------

/** Cursors already visited, so "Previous" is a real step back, not a reload. */
const trail = [];
let nextCursor = null;
let objectURLs = [];
let activeCursor = null;
let observationTimer = null;
let observationStartedAt = null;

function stopObservation() {
  if (observationTimer !== null) clearTimeout(observationTimer);
  observationTimer = null;
  observationStartedAt = null;
}

function scheduleObservation(analyses) {
  if (observationTimer !== null) clearTimeout(observationTimer);
  observationTimer = null;
  const visible = document.visibilityState !== "hidden";
  const now = Date.now();
  if (analyses.some(analysis => analysis?.status === "analyzing")) {
    observationStartedAt ??= now;
  } else {
    observationStartedAt = null;
  }
  if (!shouldPollAnalyses(analyses, { visible,
    elapsedMs: observationStartedAt === null ? 0 : now - observationStartedAt })) return;
  observationTimer = setTimeout(() => {
    observationTimer = null;
    load(activeCursor);
  }, OBSERVATION_INTERVAL_MS);
}

function say(text, isError = false, requestId = null) {
  view.message.textContent = text ?? "";
  view.message.dataset.tone = isError ? "error" : "info";
  if (requestId) {
    const reference = document.createElement("code");
    reference.textContent = ` ref ${requestId}`;
    view.message.appendChild(reference);
  }
}

async function request(path) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Sign in to continue.");
  const token = await user.getIdToken();
  let response;
  try { response = await fetch(path, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new Error("The request could not complete. Check your connection."); }
  if (path.endsWith("/source")) {
    if (!response.ok) { const failure = new Error("The image could not be loaded."); failure.status = response.status; throw failure; }
    return response.blob();
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = new Error(payload?.error?.message ?? "The request failed.");
    failure.code = payload?.error?.code ?? "unknown";
    failure.requestId = payload?.error?.requestId ?? response.headers.get("x-request-id");
    throw failure;
  }
  return payload;
}

// --- rendering ------------------------------------------------------------

const text = (tag, content, className) => {
  const node = document.createElement(tag);
  node.textContent = content ?? "";
  if (className) node.className = className;
  return node;
};
const when = (iso) => (iso ? new Date(iso).toLocaleString() : "time unavailable");

function releaseImages() {
  for (const url of objectURLs) URL.revokeObjectURL(url);
  objectURLs = [];
}

function facings(report) {
  const table = document.createElement("table");
  table.className = "facings";
  const head = table.createTHead().insertRow();
  for (const [label, className] of [["Product", ""], ["Facings", "col-count"], ["Confidence", "col-conf"]]) {
    const cell = text("th", label, className); cell.scope = "col"; head.appendChild(cell);
  }
  const body = table.createTBody();
  for (const product of report?.identifiedProducts ?? []) {
    const row = body.insertRow();
    row.appendChild(text("td", product.name));
    row.appendChild(text("td", String(product.count ?? "—"), "col-count"));
    const badge = text("span", product.confidence ?? "unknown", "conf");
    badge.dataset.level = product.confidence ?? "unknown";
    if ((product.visibleEvidence ?? []).length) badge.title = product.visibleEvidence.join("; ");
    const cell = text("td", "", "col-conf"); cell.appendChild(badge); row.appendChild(cell);
  }
  return table;
}

function attempts(analysis) {
  const strip = document.createElement("div");
  strip.className = "strip";
  strip.appendChild(text("h3", `Attempts (${analysis.runCount ?? 0})`));
  const runs = analysis.runs ?? [];
  if (runs.length === 0) strip.appendChild(text("p", "No attempt recorded.", "meta"));
  runs.forEach((run, index) => {
    const { number, asked, outcome } = attemptLine(run, index);
    const line = document.createElement("div");
    line.className = "run-line";
    line.appendChild(text("span", number, "run-no"));
    line.appendChild(text("span", asked, run.context ? "run-ctx" : "run-none"));
    line.appendChild(text("span", "", "spacer"));
    line.appendChild(text("span", outcome, "meta"));
    strip.appendChild(line);
    if (run.diagnostics) {
      const details = document.createElement("details");
      details.className = "run-diagnostics";
      details.appendChild(text("summary", "Run diagnostics"));
      details.appendChild(text("pre", JSON.stringify(run.diagnostics, null, 2)));
      strip.appendChild(details);
    }
  });
  return strip;
}

function evidence(analysis) {
  const box = document.createElement("div");
  box.className = "evidence";
  const image = document.createElement("img");
  image.alt = analysis.fileName ? `Uploaded image ${analysis.fileName}` : "Uploaded image";
  const note = text("p", "Loading image…", "imgmeta");
  box.append(image, note);
  request(`${BASE}/${analysis.ownerKey}/${analysis.analysisId}/source`).then((blob) => {
    const url = URL.createObjectURL(blob);
    objectURLs.push(url);
    image.src = url;
    note.textContent = `${analysis.width ?? "?"} × ${analysis.height ?? "?"} px · ${analysis.byteLength ?? "?"} bytes`;
  }).catch((error) => {
    // Explicit, never a broken icon: the record exists, its bytes do not answer.
    image.remove();
    note.textContent = error.status === 404 ? "Image not stored." : "Image unavailable right now.";
  });
  if (analysis.report?.summary) box.appendChild(text("p", analysis.report.summary, "summary"));
  return box;
}

function row(analysis) {
  const details = document.createElement("details");
  details.className = "analysis run-row";
  const summary = document.createElement("summary");
  summary.className = "analysis-head";
  const status = text("span", analysis.status ?? "unknown", "status");
  status.dataset.state = analysis.status ?? "unknown";
  const products = analysis.report?.identifiedProducts?.length;
  const facingTotal = (analysis.report?.identifiedProducts ?? []).reduce((sum, p) => sum + (Number(p.count) || 0), 0);
  summary.append(
    status,
    text("span", ownerText(analysis.owner), "owner"),
    text("span", when(analysis.createdAt), "meta"),
    text("span", analysis.fileName ?? "unnamed file", "filename"),
    text("span", "", "spacer"),
    text("span", products == null ? "no report" : `${products} products · ${facingTotal} facings`, "meta"),
    text("span", `${analysis.runCount ?? 0} attempt${analysis.runCount === 1 ? "" : "s"}`, "meta")
  );
  details.appendChild(summary);
  const body = document.createElement("div");
  body.className = "analysis-body";
  const rows = document.createElement("div");
  rows.className = "rows";
  if (analysis.report) rows.appendChild(facings(analysis.report));
  else rows.appendChild(text("p", analysis.failureReason ? `Failed: ${analysis.failureReason}` : "No report yet.", "meta"));
  rows.appendChild(attempts(analysis));
  const keys = text("p", `owner ${analysis.ownerKey?.slice(0, 12)}… · analysis ${analysis.analysisId}`, "meta keys");
  rows.appendChild(keys);
  let loaded = false;
  details.addEventListener("toggle", () => {
    if (details.open && !loaded) { loaded = true; body.prepend(evidence(analysis)); }
  });
  body.appendChild(rows);
  details.appendChild(body);
  return details;
}

function render(page) {
  releaseImages();
  view.rows.replaceChildren(...page.analyses.map(row));
  view.empty.hidden = page.analyses.length > 0;
  view.count.textContent = page.analyses.length === 0 ? "" : `${page.analyses.length} on this page`;
  nextCursor = page.nextCursor ?? null;
  view.next.disabled = !nextCursor;
  view.previous.disabled = trail.length === 0;
  scheduleObservation(page.analyses);
}

function filters() {
  return {
    owner: view.owner.value, status: view.status.value, from: view.from.value, to: view.to.value,
    limit: view.limit.value
  };
}

function showNotAuthorized(refused) {
  view.notAuthorized.hidden = !refused;
  view.main.hidden = refused;
}

async function load(cursor = null) {
  activeCursor = cursor;
  say("Loading…");
  try {
    const page = await request(BASE + queryString({ ...filters(), cursor }));
    showNotAuthorized(false);
    render(page);
    say("");
  } catch (error) {
    if (error.code === "forbidden") { showNotAuthorized(true); say(""); return; }
    say(error.message, true, error.requestId);
  }
}

function start() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { stopObservation(); return; }
    if (firebase.auth().currentUser) load(activeCursor);
  });
  view.status.append(...STATUSES.map((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value; return option; }));
  view.filters.addEventListener("submit", (event) => { event.preventDefault(); trail.length = 0; load(); });
  view.clear.addEventListener("click", () => { view.filters.reset(); trail.length = 0; load(); });
  view.next.addEventListener("click", () => {
    if (!nextCursor) return;
    trail.push(view.rows.dataset.cursor ?? "");
    view.rows.dataset.cursor = nextCursor;
    load(nextCursor);
  });
  view.previous.addEventListener("click", () => {
    if (trail.length === 0) return;
    const cursor = trail.pop();
    view.rows.dataset.cursor = cursor;
    load(cursor || null);
  });

  view.signIn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try { await firebase.auth().signInWithPopup(provider); }
    catch (error) {
      if (popupFailed(error?.code)) { say("Continuing without a popup…"); firebase.auth().signInWithRedirect(provider).catch((e) => say(signInErrorMessage(e?.code), true)); return; }
      say(signInErrorMessage(error?.code), true);
    }
  });
  firebase.auth().getRedirectResult().catch((error) => say(signInErrorMessage(error?.code), true));
  view.emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    view.emailSignIn.disabled = true;
    try { await firebase.auth().signInWithEmailAndPassword(view.email.value.trim(), view.password.value); view.password.value = ""; }
    catch (error) { say(signInErrorMessage(error?.code), true); }
    finally { view.emailSignIn.disabled = false; }
  });
  view.forgot.addEventListener("click", async () => {
    const email = view.email.value.trim();
    if (!email) { say(signInErrorMessage("auth/missing-email"), true); view.email.focus(); return; }
    try { await firebase.auth().sendPasswordResetEmail(email); } catch {}
    say("If that address has an account, a reset email is on its way.");
  });
  view.signOut.addEventListener("click", () => firebase.auth().signOut());

  firebase.auth().onAuthStateChanged((user) => {
    const signedIn = Boolean(user);
    view.signedOut.hidden = signedIn;
    view.main.hidden = !signedIn;
    view.signOut.hidden = !signedIn;
    view.notAuthorized.hidden = true;
    say("");
    if (!signedIn) { stopObservation(); releaseImages();
      view.rows.replaceChildren(); trail.length = 0; return; }
    trail.length = 0;
    delete view.rows.dataset.cursor;
    load();
  });
}

if (typeof document !== "undefined" && typeof firebase !== "undefined") start();
