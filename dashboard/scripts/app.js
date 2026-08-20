import {
  analyzeVistaPhoto, loadDetail, loadEvidence, loadInspections, loadVistaArtifact,
  loadVistaPackages, recordReview
} from "./api.js";
import {
  message, renderDetail, renderLists, renderVistaDetail, renderVistaList, showSession
} from "./view.js";

const auth = firebase.auth();
const byId = (id) => document.getElementById(id);
let selectedScanId;

async function refresh() {
  try {
    renderLists(await loadInspections(), selectInspection);
    message("");
  } catch (error) { message(error.message); }
  // VISTA packages load independently: the older inspections view failing
  // should not hide them, nor the reverse.
  try {
    renderVistaList(await loadVistaPackages(), selectVistaPackage);
  } catch (error) { message(error.message); }
}

async function selectVistaPackage(run) {
  message("Loading package evidence…");
  try {
    const images = run.artifacts.filter((a) => a.kind.startsWith("image/"));
    const blobs = new Map(await Promise.all(images.map(async (artifact) =>
      [artifact.sha256, await loadVistaArtifact(run.runId, artifact.sha256, run.ownerKey)]
    )));
    // The device's own account of the run travels inside the package as an
    // artifact. Fetching it is what lets the review show what the iPhone
    // reported beside the photograph, instead of only the photograph.
    const chain = await loadAuditChain(run);

    // The finding is merged into the run object already in hand and the view
    // redrawn from it. Re-fetching the package instead would re-download every
    // photograph to show one new cell.
    async function analysePhoto(sha256, button) {
      button.disabled = true;
      button.textContent = "Analysing…";
      message("Asking the server to recognise this capture…");
      try {
        const { finding } = await analyzeVistaPhoto(run.runId, sha256, run.ownerKey);
        run.analysis ??= {};
        run.analysis.photos ??= {};
        run.analysis.photos[sha256] = finding;
        renderVistaDetail(run, blobs, chain, analysePhoto);
        message("");
      } catch (error) {
        button.disabled = false;
        button.textContent = "Analyse this photo";
        message(error.message);
      }
    }

    renderVistaDetail(run, blobs, chain, analysePhoto);
    message("");
  } catch (error) { message(error.message); }
}

/**
 * The sealed audit chain, or null when the package carries none. A package
 * without it is still worth showing — the photographs are the evidence — so a
 * failure here degrades the iPhone column rather than the whole view.
 */
async function loadAuditChain(run) {
  const audit = run.artifacts.find((a) => a.kind === "audit/events");
  if (!audit) return null;
  try {
    const blob = await loadVistaArtifact(run.runId, audit.sha256, run.ownerKey);
    return JSON.parse(await blob.text());
  } catch {
    return null;
  }
}

async function selectInspection(scanId) {
  selectedScanId = scanId;
  message("Loading original evidence…");
  try {
    const [detail, evidence] = await Promise.all([
      loadDetail(scanId),
      loadEvidence(scanId)
    ]);
    renderDetail(detail, evidence);
    message("");
  } catch (error) { message(error.message); }
}

byId("sign-in").addEventListener("click", async () => {
  try { await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
  catch (error) { message(error.message); }
});
byId("sign-out").addEventListener("click", () => auth.signOut());
byId("refresh").addEventListener("click", refresh);
byId("review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const disposition = new FormData(form).get("disposition");
  try {
    await recordReview(selectedScanId, disposition, byId("notes").value);
    form.reset();
    await Promise.all([refresh(), selectInspection(selectedScanId)]);
    message("Review recorded.");
  } catch (error) { message(error.message); }
});
auth.onAuthStateChanged((user) => {
  showSession(user);
  if (user) refresh();
});
