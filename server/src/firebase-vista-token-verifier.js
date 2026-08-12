export function createFirebaseVistaTokenVerifier(auth) {
  if (!auth || typeof auth.verifyIdToken !== "function") {
    throw new TypeError("Firebase Auth is required.");
  }
  return (token) => auth.verifyIdToken(token, true);
}
