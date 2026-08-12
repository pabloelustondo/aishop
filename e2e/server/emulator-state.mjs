// Reads what the server persisted, straight from the emulators' REST
// APIs. "Bearer owner" is the emulators' built-in admin credential; it
// works only against local emulators, never against real Firebase.

const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const STORAGE = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1:9199";
const PROJECT = "demo-aishop-e2e";
const HEADERS = { authorization: "Bearer owner" };

export async function getRunRecord(ownerKey, runId) {
  const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/` +
    "(default)/documents/vistaInspectionPackageOwners/" +
    `${ownerKey}/runs/${runId}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Firestore emulator read failed: ${response.status}`);
  }
  return response.json();
}

// Unwraps Firestore REST typed values ({stringValue: "x"} -> "x").
export function plain(value) {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.mapValue !== undefined) {
    return Object.fromEntries(Object.entries(value.mapValue.fields ?? {})
      .map(([name, inner]) => [name, plain(inner)]));
  }
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values ?? []).map(plain);
  }
  return value.integerValue ?? value.booleanValue ?? value.nullValue ?? null;
}

export async function listRunObjects(bucket, prefix) {
  const url = `http://${STORAGE}/storage/v1/b/${bucket}/o` +
    `?prefix=${encodeURIComponent(prefix)}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) return null;
  return ((await response.json()).items ?? []).map(({ name }) => name);
}

export async function downloadObject(bucket, name) {
  const url = `http://${STORAGE}/storage/v1/b/${bucket}/o/` +
    `${encodeURIComponent(name)}?alt=media`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`Storage emulator download failed: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
