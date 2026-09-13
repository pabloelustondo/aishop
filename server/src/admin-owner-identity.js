import { createHash } from "node:crypto";

/**
 * Turns an owner key back into something a person can recognise.
 *
 * An owner key is `sha256(uid)` and cannot be inverted, so the resolver
 * walks the project's accounts, hashes each uid, and remembers the map for a
 * short while. The answer is a label and a kind — never the uid, which is
 * what the hash exists to keep out of responses and logs.
 *
 * Kinds: `email` (an email/password or Google account with an address),
 * `google` (a Google account exposing only a display name), `anonymous` (an
 * account with no provider, as the earlier sprints minted), `unresolved` (no
 * account hashes to this key: deleted, or from another project).
 */
export const OWNER_KINDS = Object.freeze(["email", "google", "anonymous", "unresolved"]);
export const CACHE_MS = 60_000;
const PAGE = 1000;
const MAX_PAGES = 5;

const hashOf = (uid) => createHash("sha256").update(uid).digest("hex");

/** Pure. One account becomes one label. */
export function describeAccount(user) {
  const providers = Array.isArray(user?.providerData) ? user.providerData : [];
  if (typeof user?.email === "string" && user.email.length > 0) {
    return Object.freeze({ label: user.email, kind: "email" });
  }
  const google = providers.find((provider) => provider?.providerId === "google.com");
  if (google && typeof user.displayName === "string" && user.displayName.length > 0) {
    return Object.freeze({ label: user.displayName, kind: "google" });
  }
  if (providers.length === 0) return Object.freeze({ label: null, kind: "anonymous" });
  return Object.freeze({ label: null, kind: "unresolved" });
}

export const UNRESOLVED = Object.freeze({ label: null, kind: "unresolved" });

export function createOwnerIdentityResolver({ auth, now = () => Date.now(), cacheMs = CACHE_MS } = {}) {
  if (!auth || typeof auth.listUsers !== "function") throw new TypeError("Firebase Auth is required.");
  let cache = null;
  let loading = null;

  async function load() {
    const map = new Map();
    let pageToken;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await auth.listUsers(PAGE, pageToken);
      for (const user of result.users ?? []) {
        if (typeof user?.uid === "string") map.set(hashOf(user.uid), describeAccount(user));
      }
      pageToken = result.pageToken;
      if (!pageToken) break;
    }
    return map;
  }

  async function table() {
    if (cache && now() - cache.at < cacheMs) return cache.map;
    // One walk at a time: a burst of admin requests on a cold process would
    // otherwise list the directory once per request.
    loading ??= load().then((map) => { cache = { map, at: now() }; return map; })
      .finally(() => { loading = null; });
    return loading;
  }

  return Object.freeze({
    /** The label for one key. A failure to list is "unresolved", not a failed page. */
    async labelFor(ownerKey) {
      try {
        return (await table()).get(ownerKey) ?? UNRESOLVED;
      } catch {
        return UNRESOLVED;
      }
    },
    async labelsFor(ownerKeys) {
      let map;
      try { map = await table(); } catch { map = new Map(); }
      return Object.fromEntries([...new Set(ownerKeys)].map((key) => [key, map.get(key) ?? UNRESOLVED]));
    }
  });
}
