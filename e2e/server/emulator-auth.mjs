// Mints a real Firebase user and ID token from the local Auth emulator.
// Anonymous sign-up is sufficient: the endpoint derives ownership from
// the verified uid only, so any emulator user exercises the real path.

const DEFAULT_HOST = "127.0.0.1:9099";

export async function mintEmulatorUser() {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? DEFAULT_HOST;
  const url = `http://${host}/identitytoolkit.googleapis.com/` +
    "v1/accounts:signUp?key=e2e-fake-key";
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!response.ok) {
    throw new Error(`Auth emulator sign-up failed: ${response.status}`);
  }
  const { idToken, localId } = await response.json();
  if (!idToken || !localId) {
    throw new Error("The Auth emulator returned no usable token.");
  }
  return { idToken, uid: localId };
}

export async function mintEmulatorIdToken() {
  return (await mintEmulatorUser()).idToken;
}
