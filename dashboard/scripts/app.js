import {
  loadDetail, loadEvidence, loadInspections, loadVistaArtifact,
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
    renderVistaDetail(run, blobs);
    message("");
  } catch (error) { message(error.message); }
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
