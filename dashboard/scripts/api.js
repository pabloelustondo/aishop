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

export async function recordReview(scanId, disposition, notes) {
  return (await authorizedFetch(`/inspections/${scanId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ disposition, notes })
  })).json();
}
