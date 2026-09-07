/**
 * The agent upload page.
 *
 * Upload and analysis are two calls on the server, and this file is where the
 * decision about who presses the second one lives:
 *
 *   - the first run fires automatically once the upload succeeds, because
 *     there is nothing a person could usefully add before seeing an answer;
 *   - a `failed` record offers Retry — the same request, worth making
 *     precisely because nothing was produced;
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

/** Mirrors the server's own ceiling, so the refusal happens before the call. */
const MAX_NOTE = 500;

const element = (id) => (typeof document === "undefined"
  ? null : document.getElementById(id));
const view = {
  signedOut: element("signed-out"), main: element("agent"),
  signIn: element("sign-in"), signOut: element("sign-out"),
  form: element("upload-form"), file: element("file"), submit: element("submit"),
  refresh: element("refresh"), list: element("analyses"),
  empty: element("empty"), message: element("message")
};

function say(text, isError = false) {
  view.message.textContent = text ?? "";
  view.message.dataset.tone = isError ? "error" : "info";
}

/**
 * The agent endpoint answers `{ error: { code, message, retryable } }`, which
 * is not the shape `scripts/api.js` reads. Rather than widen that helper for
 * two different contracts, this page reads its own.
 */
async function request(method, path, { body, json } = {}) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Sign in to continue.");
  const token = await user.getIdToken();

  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      // A multipart body sets its own content type, boundary included; naming
      // it here would send a boundary the browser did not use.
      ...(json ? { "Content-Type": "application/json" } : {})
    },
    body: json ? JSON.stringify(json) : body
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = new Error(payload?.error?.message ?? "The request failed.");
    failure.code = payload?.error?.code ?? "unknown";
    failure.retryable = payload?.error?.retryable ?? false;
    throw failure;
  }
  return payload;
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
  provider_failed: "The model could not be reached.",
  storage_unavailable: "The stored image could not be read.",
  unexpected_failure: "The run failed for an unexpected reason."
});

function textNode(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function facingsTable(report) {
  const table = document.createElement("table");
  table.className = "facings";
  const head = table.insertRow();
  head.appendChild(textNode("th", "Product"));
  const countHead = textNode("th", "Facings");
  countHead.className = "count";
  head.appendChild(countHead);
  for (const product of report.identifiedProducts ?? []) {
    const row = table.insertRow();
    row.appendChild(textNode("td", product.name));
    const count = textNode("td", String(product.count));
    count.className = "count";
    row.appendChild(count);
  }
  return table;
}

function refineControl(analysis) {
  const form = document.createElement("form");
  form.className = "refine";

  const note = document.createElement("input");
  note.type = "text";
  note.maxLength = MAX_NOTE;
  // `required` alone accepts a space, and a space is not an instruction.
  note.required = true;
  note.placeholder = "Ignore the top shelf; count the boxes behind the front row…";
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
  return form;
}

function actionsFor(analysis) {
  const actions = document.createElement("div");

  if (analysis.status === "failed") {
    // The one place a repeat of the identical request is worth making — and
    // identical includes the note the failed run carried.
    const retry = textNode("button", "Retry");
    retry.type = "button";
    retry.addEventListener("click",
      () => run(analysis.analysisId, retryContextOf(analysis), retry));
    actions.appendChild(retry);
    return actions;
  }
  if (analysis.status === "uploaded") {
    // The automatic run never started — a dropped connection, a closed tab.
    const analyse = textNode("button", "Analyse");
    analyse.type = "button";
    analyse.addEventListener("click", () => run(analysis.analysisId, null, analyse));
    actions.appendChild(analyse);
    return actions;
  }
  if (analysis.status === "analyzed") {
    actions.appendChild(refineControl(analysis));
  }
  return actions;
}

function card(analysis) {
  const section = document.createElement("section");
  section.className = "analysis";

  const heading = document.createElement("div");
  heading.className = "analysis-heading";
  const title = document.createElement("div");
  title.append(
    textNode("p", STATUS_LABEL[analysis.status] ?? analysis.status, "status"),
    textNode("h3", analysis.fileName ?? analysis.analysisId)
  );
  const runs = analysis.runCount === 1 ? "1 run" : `${analysis.runCount ?? 0} runs`;
  heading.append(title, textNode("p", runs, "analysis-meta"));
  section.appendChild(heading);

  if (analysis.status === "failed") {
    section.appendChild(textNode("p",
      REASON_LABEL[analysis.failureReason] ?? "The run failed.", "note"));
  }

  if (analysis.status === "analyzed" && analysis.report) {
    // The note that produced these rows belongs beside them; a refined answer
    // read without its instruction is not the same claim.
    const asked = analysis.runs?.at(-1)?.context;
    if (asked) section.appendChild(textNode("p", `Asked: ${asked}`, "note"));
    section.appendChild(textNode("p", analysis.report.summary ?? ""));
    section.appendChild(facingsTable(analysis.report));
    const uncertain = analysis.report.uncertainItems ?? [];
    if (uncertain.length > 0) {
      section.appendChild(textNode("p",
        `${uncertain.length} item(s) the model could not identify.`, "uncertain"));
    }
  }

  section.appendChild(actionsFor(analysis));
  return section;
}

function render(analyses) {
  view.list.replaceChildren(...analyses.map(card));
  view.empty.hidden = analyses.length > 0;
}

async function refresh() {
  const payload = await request("GET", BASE);
  render(payload.analyses ?? []);
}

async function run(analysisId, context, button) {
  const note = typeof context === "string" ? context.trim() : "";
  if (button) button.disabled = true;
  say(note ? "Refining…" : "Analysing…");
  try {
    await request("POST", `${BASE}/${analysisId}/run`,
      note ? { json: { context: note } } : {});
    say("Done.");
  } catch (error) {
    // The record is already `failed` on the server, so the refreshed list
    // shows the failure and its Retry. Saying it here as well is what tells
    // the person the button they just pressed is the thing that failed.
    say(error.message, true);
  } finally {
    if (button) button.disabled = false;
    await refresh().catch(() => {});
  }
}

async function upload(file) {
  const body = new FormData();
  body.append("file", file, file.name);
  say("Uploading…");
  const created = await request("POST", BASE, { body });
  await refresh().catch(() => {});
  await run(created.analysis.analysisId, null, null);
}

/**
 * Wires the page up. Kept out of module scope so importing this file is
 * side-effect free: the decisions above can then be tested without a browser,
 * a DOM stub, or a Firebase global.
 */
function start() {
  view.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const [file] = view.file.files;
    if (!file) return;
    view.submit.disabled = true;
    try {
      await upload(file);
      view.form.reset();
    } catch (error) {
      say(error.message, true);
    } finally {
      view.submit.disabled = false;
    }
  });

  view.refresh.addEventListener("click", () => {
    refresh().catch((error) => say(error.message, true));
  });

  view.signIn.addEventListener("click", () => {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch((error) => say(error.message, true));
  });

  view.signOut.addEventListener("click", () => firebase.auth().signOut());

  firebase.auth().onAuthStateChanged((user) => {
    view.signedOut.hidden = Boolean(user);
    view.main.hidden = !user;
    view.signOut.hidden = !user;
    say("");
    if (!user) {
      view.list.replaceChildren();
      return;
    }
    // The page opens showing history rather than an empty box.
    refresh().catch((error) => say(error.message, true));
  });
}

if (typeof document !== "undefined" && typeof firebase !== "undefined") start();
