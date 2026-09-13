// Mints real Firebase users and ID tokens from the local Auth emulator.
//
// Since Sprint 011 the agent routes require the `agent: true` claim, so a
// minted user is granted it by default and its token refreshed so the claim
// is actually inside the token — the same two steps a real account goes
// through. Pass `claims: null` for an account that is signed in and nothing
// more. The VISTA package routes ignore the claim either way.
//
// Claims are written through the emulator's own admin surface (the
// `Bearer owner` convention), which needs no SDK from this directory.

const DEFAULT_HOST = "127.0.0.1:9099";
const KEY = "e2e-fake-key";
const host = () => process.env.FIREBASE_AUTH_EMULATOR_HOST ?? DEFAULT_HOST;
const identity = (method) => `http://${host()}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=${KEY}`;

async function post(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Auth emulator ${url.split("/").pop().split("?")[0]} failed: ${response.status}`);
  return response.json();
}

/** Writes custom claims on the emulator exactly as the Admin SDK would. */
export async function setEmulatorClaims(uid, claims) {
  await post(`http://${host()}/identitytoolkit.googleapis.com/v1/accounts:update`,
    { localId: uid, customAttributes: JSON.stringify(claims) },
    { authorization: "Bearer owner" });
}

/** A fresh ID token for an existing session; this is where a new claim appears. */
export async function refreshEmulatorToken(refreshToken) {
  const response = await fetch(`http://${host()}/securetoken.googleapis.com/v1/token?key=${KEY}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken })
  });
  if (!response.ok) throw new Error(`Auth emulator token refresh failed: ${response.status}`);
  const { id_token: idToken, refresh_token: next } = await response.json();
  if (!idToken) throw new Error("The Auth emulator refreshed no usable token.");
  return { idToken, refreshToken: next ?? refreshToken };
}

async function minted(signUp, claims) {
  const { idToken, localId: uid, refreshToken } = signUp;
  if (!idToken || !uid) throw new Error("The Auth emulator returned no usable token.");
  if (!claims) return { idToken, uid, refreshToken };
  await setEmulatorClaims(uid, claims);
  return { uid, ...(await refreshEmulatorToken(refreshToken)) };
}

/** Anonymous sign-up, granted the agent claim unless told otherwise. */
export async function mintEmulatorUser({ claims = { agent: true } } = {}) {
  return minted(await post(identity("signUp"), { returnSecureToken: true }), claims);
}

/** Email/password sign-up — the account shape Pablo creates in the Console. */
export async function mintEmulatorPasswordUser({ email, password, claims = null }) {
  return minted(await post(identity("signUp"), { email, password, returnSecureToken: true }), claims);
}

/** The REST sign-in a script performs; the account must already exist. */
export async function signInEmulatorPassword({ email, password }) {
  const { idToken, localId: uid, refreshToken } = await post(identity("signInWithPassword"),
    { email, password, returnSecureToken: true });
  return { idToken, uid, refreshToken };
}

export async function mintEmulatorIdToken() {
  return (await mintEmulatorUser()).idToken;
}
