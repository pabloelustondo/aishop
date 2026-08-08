import { loadDetail, loadEvidence, loadInspections, recordReview } from "./api.js";
import { message, renderDetail, renderLists, showSession } from "./view.js";

const auth = firebase.auth();
const byId = (id) => document.getElementById(id);
let selectedScanId;

async function refresh() {
  try {
    renderLists(await loadInspections(), selectInspection);
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
