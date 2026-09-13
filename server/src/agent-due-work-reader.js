import { ANALYSIS_COLLECTIONS } from "./agent-analysis-store.js";

const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const DEFAULT_DUE_WORK_LIMIT = 50;
export const MAX_DUE_WORK_LIMIT = 100;

function nowFrom(clock) {
  const now = clock();
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("The due-work clock must return a Date.");
  }
  return now;
}

const instant = value => value instanceof Date ? value.getTime()
  : typeof value?.toMillis === "function" ? value.toMillis()
    : typeof value?.toDate === "function" ? value.toDate().getTime() : null;

/** Reads overdue collection work across owners; it has no write capability. */
export function createAgentDueWorkReader({ firestore, clock = () => new Date() } = {}) {
  if (!firestore || typeof firestore.collectionGroup !== "function") {
    throw new TypeError("A Firestore instance is required.");
  }
  if (typeof clock !== "function") throw new TypeError("A due-work clock is required.");

  return Object.freeze({
    async list({ limit = DEFAULT_DUE_WORK_LIMIT } = {}) {
      if (!Number.isInteger(limit) || limit < 1 || limit > MAX_DUE_WORK_LIMIT) {
        throw new TypeError("A bounded due-work limit is required.");
      }
      const now = nowFrom(clock);
      const snapshot = await firestore.collectionGroup(ANALYSIS_COLLECTIONS.analyses)
        .where("status", "==", "analyzing")
        .where("collectionDueAt", "<=", now)
        .orderBy("collectionDueAt", "asc")
        .limit(limit).get();
      return snapshot.docs.flatMap(document => {
        const data = document.data() ?? {};
        const ownerKey = document.ref?.parent?.parent?.id;
        const currentRunId = Array.isArray(data.runs) ? data.runs.at(-1)?.runId : null;
        const leaseUntil = instant(data.collectionLeaseUntil);
        if (!OWNER_KEY.test(ownerKey ?? "") || !ANALYSIS_ID.test(document.id ?? "")
          || !RUN_ID.test(data.providerRunId ?? "")
          || data.providerRunId !== currentRunId
          || (leaseUntil !== null && leaseUntil > now.getTime())) return [];
        return [Object.freeze({ ownerKey, analysisId: document.id,
          runId: data.providerRunId, dueAt: data.collectionDueAt })];
      });
    }
  });
}
