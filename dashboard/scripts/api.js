async function authorizedFetch(path, options = {}) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Sign in to continue.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "The review request failed.");
  }
  return response;
}

export async function loadInspections() {
  return (await authorizedFetch("/inspections")).json();
}

export async function loadDetail(scanId) {
  return (await authorizedFetch(`/inspections/${scanId}`)).json();
}

export async function loadEvidence(scanId) {
  return (await authorizedFetch(`/inspections/${scanId}/evidence`)).blob();
}

const VISTA = "/v1/vista/inspection-packages";

/** Every VISTA package this caller may see: their own, or all for a reviewer. */
export async function loadVistaPackages() {
  return (await authorizedFetch(VISTA)).json();
}

/**
 * One artifact's bytes. Storage objects are private to the function's service
 * account, so the server reads and streams them — the browser never touches
 * Cloud Storage directly.
 */
export async function loadVistaArtifact(runId, sha256, ownerKey) {
  const owner = ownerKey ? `?owner=${encodeURIComponent(ownerKey)}` : "";
  return (await authorizedFetch(`${VISTA}/${runId}/artifacts/${sha256}${owner}`)).blob();
}

/**
 * Asks the server to recognise one capture. One photo per call: the function
 * has a 30 s ceiling and a shelf photograph costs seconds, so a whole-package
 * sweep would sit against that limit and fail as a unit.
 */
export async function analyzeVistaPhoto(runId, sha256, ownerKey) {
  const owner = ownerKey ? `?owner=${encodeURIComponent(ownerKey)}` : "";
  return (await authorizedFetch(
    `${VISTA}/${runId}/artifacts/${sha256}/analysis${owner}`, { method: "POST" }
  )).json();
}

export async function recordReview(scanId, disposition, notes) {
  return (await authorizedFetch(`/inspections/${scanId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ disposition, notes })
  })).json();
}
