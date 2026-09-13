/**
 * The agent upload page.
 *
 * Upload and analysis are two calls on the server, and this file is where the
 * decision about who presses the second one lives:
 *
 *   - the first run fires automatically once the upload succeeds, because
 *     there is nothing a person could usefully add before seeing an answer;
 *   - a `failed` record offers Retry — the same request, worth making
 *     precisely because nothing was produced, and carrying that run's own note;
 *   - an `analyzed` record offers no bare re-run. The same image and the same
 *     prompt buy the same rows at full price. It offers Refine instead, which
 *     sends a note, and so asks a different question.
 *
 * The two decisions that are easy to get silently wrong — what a Retry
 * resends, and what counts as a refinement — are exported as pure functions
 * so they can be tested without a browser. Nothing else in this file runs at
 * import time; the page is wired up by `start()`.
 */

const BASE = "/v1/agent/analyses";
export const OBSERVATION_INTERVAL_MS = 15_000;
export const OBSERVATION_CEILING_MS = 10 * 60_000;

export function shouldPollAnalyses(analyses, { visible = true,
  elapsedMs = 0 } = {}) {
  return visible && elapsedMs < OBSERVATION_CEILING_MS
    && Array.isArray(analyses)
    && analyses.some(analysis => analysis?.status === "analyzing");
}

/** Mirrors the server's own ceiling, so the refusal happens before the call. */
const MAX_NOTE = 500;

const element = (id) => (typeof document === "undefined"
  ? null : document.getElementById(id));
const view = {
  signedOut: element("signed-out"), main: element("agent"),
  signIn: element("sign-in"), signOut: element("sign-out"),
  emailForm: element("email-form"), email: element("email"), password: element("password"),
  emailSignIn: element("email-sign-in"), forgot: element("forgot"),
  notAuthorized: element("not-authorized"), allRuns: element("all-runs"),
  form: element("upload-form"), file: element("file"), submit: element("submit"),
  uploadAnother: element("upload-another"), refresh: element("refresh"),
  live: element("live"), liveText: element("live-text"),
  list: element("analyses"), empty: element("empty"), message: element("message")
};

function say(text, isError = false, requestId = null) {
  view.message.textContent = text ?? "";
  view.message.dataset.tone = isError ? "error" : "info";
  if (requestId) view.message.appendChild(diagnosticReference(requestId));
}

function busy(label) {
  view.liveText.textContent = label;
  view.live.dataset.busy = label === "Idle" ? "false" : "true";
}

/**
 * The agent endpoint answers `{ error: { code, message, retryable } }`, which
 * is not the shape `scripts/api.js` reads. Rather than widen that helper for
 * two different contracts, this page reads its own.
 */
async function authorized(method, path, { body, json } = {}) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Sign in to continue.");
  const token = await user.getIdToken();
  return fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      // A multipart body sets its own content type, boundary included; naming
      // it here would send a boundary the browser did not use.
      ...(json ? { "Content-Type": "application/json" } : {})
    },
    body: json ? JSON.stringify(json) : body
  });
}

async function request(method, path, options) {
  let response;
  try { response = await authorized(method, path, options); }
  catch (error) {
    if (error instanceof TypeError) throw new Error("The request could not complete. No server diagnostic reference is available; check your connection.");
    throw error;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = new Error(payload?.error?.message ?? "The request failed.");
    failure.code = payload?.error?.code ?? "unknown";
    failure.requestId = payload?.error?.requestId ?? response.headers.get("x-request-id");
    failure.retryable = payload?.error?.retryable ?? false;
    throw failure;
  }
  return payload;
}

/**
 * Firebase's error codes, said plainly. The page never shows a code: a
 * person at a sign-in form needs to know what to do next, and with
 * email-enumeration protection on, a wrong address and a wrong password are
 * deliberately the same answer.
 */
export function signInErrorMessage(code) {
  switch (code) {
    case "auth/invalid-email":
    case "auth/missing-email":
      return "Enter the email address of your account.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "The email or password is not right.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, then try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/network-request-failed":
      return "The sign-in service could not be reached. Check your connection.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "The sign-in window was closed before finishing.";
    default:
      return "Sign-in did not complete. Try again.";
  }
}

/**
 * A popup that never opened, or closed before it finished, is a browser
 * decision, not a credential problem; the redirect path asks the same
 * question without a popup. Every other failure is answered where it is.
 */
export function shouldFallBackToRedirect(code) {
  return code === "auth/popup-blocked"
    || code === "auth/popup-closed-by-user"
    || code === "auth/cancelled-popup-request";
}

/**
 * What a Retry resends.
 *
 * A retry exists because a run produced nothing, so it must repeat that run's
 * *input* — including the note, when the failed run was a refinement. Sending
 * null instead silently asks the original question and returns an answer to
 * something nobody asked.
 */
export function retryContextOf(analysis) {
  const runs = Array.isArray(analysis?.runs) ? analysis.runs : [];
  return runs.length > 0 ? (runs[runs.length - 1].context ?? null) : null;
}

/**
 * What counts as a refinement, decided before any call is spent.
 *
 * Whitespace satisfies the input's `required` attribute but is not an
 * instruction, and a blank note would reach the server as a bodyless rerun —
 * a second identical question at full price. Over the ceiling is refused
 * rather than truncated: a silently shortened instruction produces an answer
 * to a question nobody asked.
 */
export function refinementNote(value) {
  if (typeof value !== "string") return null;
  const note = value.trim();
  if (note === "" || note.length > MAX_NOTE) return null;
  return note;
}

const STATUS_LABEL = Object.freeze({
  uploaded: "Stored, not yet analysed",
  analyzing: "Analysing",
  analyzed: "Analysed",
  failed: "Failed"
});

/** Reasons a person can act on, in their own words rather than the code's. */
const REASON_LABEL = Object.freeze({
  provider_timeout: "The model did not answer in time.",
  provider_failed: "The analysis provider failed or returned an unusable response.",
  storage_unavailable: "The stored image could not be read.",
  unexpected_failure: "The run failed for an unexpected reason."
});

function textNode(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

const spacer = () => textNode("span", "", "spacer");

/**
 * Object URLs made for the images on screen.
 *
 * The source route needs an Authorization header, which an `<img src>` cannot
 * send, so the bytes are fetched and wrapped in a blob URL. Every one is
 * revoked before the list is redrawn; without that, each refresh would leak
 * another copy of every photograph for the life of the tab.
 */
let objectURLs = [];
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
    refresh().catch(error => say(error.message, true, error.requestId));
  }, OBSERVATION_INTERVAL_MS);
}
function releaseImages() {
  for (const url of objectURLs) URL.revokeObjectURL(url);
  objectURLs = [];
}

async function sourceURL(analysisId) {
  const response = await authorized("GET", `${BASE}/${analysisId}/source`);
  if (!response.ok) return null;
  const url = URL.createObjectURL(await response.blob());
  objectURLs.push(url);
  return url;
}

/** The image a count came from, loaded after the row it explains is on screen. */
function evidenceImage(analysis) {
  const figure = document.createElement("div");
  figure.className = "evidence";

  const image = document.createElement("img");
  image.alt = `The photograph analysed as ${analysis.fileName ?? analysis.analysisId}`;
  image.loading = "lazy";
  figure.appendChild(image);
  sourceURL(analysis.analysisId)
    .then((url) => { if (url) image.src = url; })
    .catch(() => { image.replaceWith(textNode("p", "The image could not be loaded.", "meta")); });

  const dimensions = analysis.width && analysis.height
    ? `${analysis.width} × ${analysis.height}` : null;
  figure.appendChild(textNode("p",
    [dimensions, "the image these counts came from"].filter(Boolean).join(" · "), "imgmeta"));

  if (analysis.status === "analyzed" && analysis.report?.summary) {
    figure.appendChild(textNode("p", analysis.report.summary, "summary"));
  }
  if (analysis.status === "failed") {
    figure.appendChild(textNode("p",
      REASON_LABEL[analysis.failureReason] ?? "The run failed.", "summary"));
  }
  return figure;
}

/**
 * Three columns, and the confidence badge carries its own evidence.
 *
 * A fourth column, and then a marker column, were both tried and dropped: a
 * column existing only to hold a hover target earns nothing. The badge already
 * answers "how sure", so it answers "why" too. It stays visible rather than
 * hiding behind that hover, because it is the signal a person scans for.
 */
function facingsTable(report) {
  const table = document.createElement("table");
  table.className = "facings";

  const head = table.createTHead().insertRow();
  for (const [label, className] of [
    ["Product", ""], ["Facings", "col-count"], ["Confidence", "col-conf"]
  ]) {
    const cell = textNode("th", label, className);
    cell.scope = "col";
    head.appendChild(cell);
  }

  const body = table.createTBody();
  for (const product of report.identifiedProducts ?? []) {
    const row = body.insertRow();
    row.appendChild(textNode("td", product.name));
    row.appendChild(textNode("td", String(product.count), "col-count"));

    const cell = textNode("td", "", "col-conf");
    const evidence = (product.visibleEvidence ?? []).join("; ");
    const badge = textNode("span", product.confidence ?? "unknown", "conf");
    badge.dataset.level = product.confidence ?? "unknown";
    if (evidence) {
      badge.tabIndex = 0;
      badge.setAttribute("role", "note");
      badge.setAttribute("aria-label",
        `Confidence ${product.confidence ?? "unknown"}. Visible evidence: ${evidence}`);
      // The styled tooltip does the work; `title` is only the fallback under it.
      badge.title = evidence;
      badge.appendChild(textNode("span", evidence, "tip"));
    }
    cell.appendChild(badge);
    row.appendChild(cell);
  }
  return table;
}

/** Listed with their reasons: a count of unidentified items is unactionable. */
function uncertainStrip(report) {
  const items = report.uncertainItems ?? [];
  if (items.length === 0) return null;

  const strip = document.createElement("div");
  strip.className = "strip tint";
  strip.appendChild(textNode("h3",
    `${items.length} item${items.length === 1 ? "" : "s"} the model could not identify`));

  const list = document.createElement("ul");
  for (const item of items) {
    const entry = document.createElement("li");
    entry.append(item.description ?? "Unidentified item");
    if (item.reason) entry.append(" — ", textNode("span", item.reason, "why"));
    list.appendChild(entry);
  }
  strip.appendChild(list);
  return strip;
}

/** Every run with the note that produced it, so an answer reads beside its question. */
function runStrip(analysis) {
  const runs = analysis.runs ?? [];
  if (runs.length === 0) return null;

  const strip = document.createElement("div");
  strip.className = "strip";
  strip.appendChild(textNode("h3", "Run history"));

  runs.forEach((run, index) => {
    const line = document.createElement("div");
    line.className = "run-line";
    line.appendChild(textNode("span", `Run ${run.runNumber ?? index + 1}`, "run-no"));
    line.appendChild(run.context
      ? textNode("span", `“${run.context}”`, "run-ctx")
      : textNode("span", `no note — ${run.trigger ?? (index === 0 ? "initial run" : "trigger unavailable")}`, "run-none"));
    line.appendChild(spacer());
    const outcome = [run.status, run.failureReason].filter(Boolean).join(" · ");
    line.appendChild(textNode("span", outcome, "meta"));
    strip.appendChild(line);
    if (run.diagnostics) {
      const details = document.createElement("details");
      details.className = "run-diagnostics";
      details.appendChild(textNode("summary", "Run diagnostics"));
      if (run.diagnostics.requestId) details.appendChild(diagnosticReference(run.diagnostics.requestId));
      details.appendChild(textNode("pre", JSON.stringify(run.diagnostics, null, 2)));
      strip.appendChild(details);
    }
  });
  return strip;
}

function actionStrip(analysis) {
  const strip = document.createElement("div");
  strip.className = "strip tint";

  if (analysis.status === "analyzed") {
    const form = document.createElement("form");
    form.className = "refine";

    const note = document.createElement("input");
    note.type = "text";
    note.maxLength = MAX_NOTE;
    // `required` alone accepts a space, and a space is not an instruction.
    note.required = true;
    note.placeholder = "What should the next run do differently?";
    note.setAttribute("aria-label", "What should the next run do differently?");

    const button = textNode("button", "Refine");
    button.type = "submit";
    form.append(note, button);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const asked = refinementNote(note.value);
      if (asked === null) {
        // Refused here, before a provider call is spent on the same question.
        say("A refinement needs a note saying what to do differently.", true);
        note.focus();
        return;
      }
      await run(analysis.analysisId, asked, button);
    });
    strip.appendChild(form);
    return strip;
  }

  const actions = document.createElement("div");
  actions.className = "actions";
  if (analysis.status === "failed" || analysis.status === "uploaded") {
    // Retry repeats the failed run's input, note included. On `uploaded` the
    // automatic run never started — a dropped connection, a closed tab.
    const label = analysis.status === "failed" ? "Retry" : "Analyse";
    const button = textNode("button", label);
    button.type = "button";
    button.addEventListener("click",
      () => run(analysis.analysisId, retryContextOf(analysis), button));
    actions.appendChild(button);
  }
  if (actions.childElementCount === 0) return null;
  strip.appendChild(actions);
  return strip;
}

function card(analysis) {
  const section = document.createElement("section");
  section.className = "analysis";

  const head = document.createElement("div");
  head.className = "analysis-head";
  const status = textNode("span", STATUS_LABEL[analysis.status] ?? analysis.status, "status");
  status.dataset.state = analysis.status;
  head.append(status, textNode("span", analysis.fileName ?? analysis.analysisId, "filename"), spacer());
  const runs = analysis.runCount === 1 ? "1 run" : `${analysis.runCount ?? 0} runs`;
  head.appendChild(textNode("p", [
    runs,
    analysis.byteLength ? `${Math.round(analysis.byteLength / 1024)} kB` : null,
    analysis.model,
    analysis.createdAt ? new Date(analysis.createdAt).toLocaleString() : null
  ].filter(Boolean).join(" · "), "meta"));
  section.appendChild(head);

  const body = document.createElement("div");
  body.className = "analysis-body";
  body.appendChild(evidenceImage(analysis));

  const rows = document.createElement("div");
  rows.className = "rows";
  if (analysis.status === "analyzed" && analysis.report) {
    rows.appendChild(facingsTable(analysis.report));
  }
  body.appendChild(rows);
  section.appendChild(body);

  if (analysis.status === "analyzed" && analysis.report) {
    const uncertain = uncertainStrip(analysis.report);
    if (uncertain) section.appendChild(uncertain);
  }
  const runHistory = runStrip(analysis);
  if (runHistory) section.appendChild(runHistory);
  const actions = actionStrip(analysis);
  if (actions) section.appendChild(actions);

  return section;
}

/**
 * With nothing uploaded the upload control is the page; with anything on
 * screen it collapses to a header button. Upload is an action, not a
 * destination, which is why it is not a page of its own.
 */
function render(analyses) {
  releaseImages();
  view.list.replaceChildren(...analyses.map(card));
  const nothing = analyses.length === 0;
  view.empty.hidden = !nothing;
  view.form.hidden = !nothing;
  view.uploadAnother.hidden = nothing;
  scheduleObservation(analyses);
}

/**
 * A signed-in account without the agent authorization is refused with 403
 * by every route. That is a state of the page, not a message: the list is
 * not empty, it is unavailable, and saying "nothing analysed yet" would be
 * a lie about why.
 */
function showNotAuthorized(refused) {
  view.notAuthorized.hidden = !refused;
  view.main.hidden = refused;
  if (refused) {
    view.form.hidden = true;
    view.uploadAnother.hidden = true;
    view.refresh.hidden = true;
  }
}

async function refresh() {
  try {
    const payload = await request("GET", BASE);
    showNotAuthorized(false);
    render(payload.analyses ?? []);
  } catch (error) {
    if (error.code === "forbidden") { showNotAuthorized(true); return; }
    throw error;
  }
}

async function run(analysisId, context, button) {
  const note = typeof context === "string" ? context.trim() : "";
  if (button) button.disabled = true;
  busy(note ? "Refining" : "Analysing");
  say(note ? "Refining…" : "Analysing…");
  try {
    await request("POST", `${BASE}/${analysisId}/run`,
      note ? { json: { context: note } } : {});
    say("Analysis started. Results will appear here automatically.");
  } catch (error) {
    // The record is already `failed` on the server, so the refreshed list
    // shows the failure and its Retry. Saying it here as well is what tells
    // the person the button they just pressed is the thing that failed.
    say(error.message, true, error.requestId);
  } finally {
    if (button) button.disabled = false;
    busy("Idle");
    await refresh().catch(() => {});
  }
}

async function upload(file) {
  const body = new FormData();
  body.append("file", file, file.name);
  busy("Uploading");
  say("Uploading…");
  const created = await request("POST", BASE, { body });
  await refresh().catch(() => {});
  await run(created.analysis.analysisId, null, null);
}

function start() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { stopObservation(); return; }
    if (firebase.auth().currentUser) refresh()
      .catch(error => say(error.message, true, error.requestId));
  });
  view.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const [file] = view.file.files;
    if (!file) return;
    view.submit.disabled = true;
    try {
      await upload(file);
      view.form.reset();
    } catch (error) {
      say(error.message, true, error.requestId);
    } finally {
      view.submit.disabled = false;
      busy("Idle");
    }
  });

  view.uploadAnother.addEventListener("click", () => {
    view.form.hidden = false;
    view.file.focus();
  });

  view.refresh.addEventListener("click", () => {
    refresh().catch((error) => say(error.message, true));
  });

  view.signIn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      if (shouldFallBackToRedirect(error?.code)) {
        say("Continuing without a popup…");
        firebase.auth().signInWithRedirect(provider)
          .catch((redirectError) => say(signInErrorMessage(redirectError?.code), true));
        return;
      }
      say(signInErrorMessage(error?.code), true);
    }
  });

  // The redirect path lands back here; its failure, if any, is the only
  // thing left to say. A success is reported by onAuthStateChanged as usual.
  firebase.auth().getRedirectResult()
    .catch((error) => say(signInErrorMessage(error?.code), true));

  view.emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    view.emailSignIn.disabled = true;
    try {
      await firebase.auth().signInWithEmailAndPassword(view.email.value.trim(), view.password.value);
      view.password.value = "";
    } catch (error) {
      say(signInErrorMessage(error?.code), true);
    } finally {
      view.emailSignIn.disabled = false;
    }
  });

  view.forgot.addEventListener("click", async () => {
    const email = view.email.value.trim();
    if (!email) { say(signInErrorMessage("auth/missing-email"), true); view.email.focus(); return; }
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      // The same sentence whether or not the address exists: the page does
      // not confirm which addresses are accounts.
      say("If that address has an account, a reset email is on its way.");
    } catch (error) {
      say(error?.code === "auth/invalid-email"
        ? signInErrorMessage(error.code)
        : "If that address has an account, a reset email is on its way.");
    }
  });

  view.signOut.addEventListener("click", () => firebase.auth().signOut());

  firebase.auth().onAuthStateChanged((user) => {
    const signedIn = Boolean(user);
    view.signedOut.hidden = signedIn;
    view.main.hidden = !signedIn;
    for (const control of [view.signOut, view.refresh, view.live]) {
      control.hidden = !signedIn;
    }
    say("");
    busy("Idle");
    view.notAuthorized.hidden = true;
    view.allRuns.hidden = true;
    if (!signedIn) {
      stopObservation();
      releaseImages();
      view.list.replaceChildren();
      view.form.hidden = true;
      view.uploadAnother.hidden = true;
      return;
    }
    // The All-runs link is shown to accounts whose token carries the admin
    // role. It is a courtesy: the server refuses everyone else regardless.
    user.getIdTokenResult().then(({ claims }) => { view.allRuns.hidden = claims?.admin !== true; }).catch(() => {});
    // The page opens showing history rather than an empty box — or, for an
    // account Pablo has not authorized, the one sentence that says so.
    refresh().catch((error) => say(error.message, true, error.requestId));
  });
}

if (typeof document !== "undefined" && typeof firebase !== "undefined") start();

function diagnosticReference(requestId) {
  const wrap = document.createElement("span");
  wrap.className = "diagnostic-reference";
  const input = document.createElement("input");
  input.readOnly = true;
  input.value = requestId;
  input.setAttribute("aria-label", "Diagnostic reference");
  const button = textNode("button", "Copy reference", "secondary");
  button.type = "button";
  button.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(requestId); button.textContent = "Copied"; }
    catch { input.focus(); input.select(); button.textContent = "Select and copy reference"; }
  });
  wrap.append(input, button);
  return wrap;
}
