import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { ANALYSIS_COLLECTIONS, summarizeAnalysis } from "./agent-analysis-store.js";
import { adminError } from "./admin-api-error.js";

/**
 * Reads agent analyses across every owner. Read-only by construction: it
 * receives a Firestore handle and calls `get` on queries and documents,
 * nothing else — there is no method here that could be pointed at a write.
 *
 * Order is newest first by `createdAt`, then by document path descending so
 * two records created in the same instant page deterministically. The cursor
 * encodes exactly that pair plus the owner; it is a position, not a
 * capability, and the handler re-checks the claim on every request.
 */
export const ANALYSIS_STATUSES = Object.freeze(["uploaded", "analyzing", "analyzed", "failed"]);
export const DEFAULT_PAGE = 25;
export const MAX_PAGE = 50;
const KEY = /^[a-f0-9]{64}$/;
const ID = /^[0-9A-Za-z_-]{1,64}$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Pure. A cursor is opaque to the page and strict on the way back in. */
export function encodeCursor({ createdAt, ownerKey, analysisId }) {
  const seconds = createdAt.seconds ?? Math.floor(createdAt.getTime() / 1000);
  const nanoseconds = createdAt.nanoseconds ?? (createdAt.getTime() % 1000) * 1_000_000;
  return Buffer.from(JSON.stringify({ s: seconds, n: nanoseconds, o: ownerKey, a: analysisId }))
    .toString("base64url");
}

export function decodeCursor(cursor) {
  if (typeof cursor !== "string" || cursor.length === 0 || cursor.length > 400) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")); } catch { return null; }
  if (!payload || typeof payload !== "object") return null;
  const { s, n, o, a } = payload;
  if (!Number.isSafeInteger(s) || s < 0 || !Number.isSafeInteger(n) || n < 0 || n >= 1e9) return null;
  if (!KEY.test(o ?? "") || !ID.test(a ?? "")) return null;
  return Object.freeze({ seconds: s, nanoseconds: n, ownerKey: o, analysisId: a });
}

/** Pure. A day filter is a half-open UTC interval; anything else is refused. */
export function dayBounds(value, which) {
  const match = DAY.exec(value ?? "");
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const start = Date.UTC(year, month - 1, day);
  const probe = new Date(start);
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return new Date(which === "to" ? start + 86_400_000 : start);
}

export function normalizeListQuery({ owner, status, from, to, cursor, limit } = {}) {
  const query = {};
  if (owner !== undefined) {
    if (!KEY.test(owner)) throw adminError("filter_invalid");
    query.owner = owner;
  }
  if (status !== undefined) {
    if (!ANALYSIS_STATUSES.includes(status)) throw adminError("filter_invalid");
    query.status = status;
  }
  if (from !== undefined) {
    query.from = dayBounds(from, "from");
    if (!query.from) throw adminError("filter_invalid");
  }
  if (to !== undefined) {
    query.to = dayBounds(to, "to");
    if (!query.to) throw adminError("filter_invalid");
  }
  if (query.from && query.to && query.from >= query.to) throw adminError("filter_invalid");
  if (cursor !== undefined) {
    query.cursor = decodeCursor(cursor);
    if (!query.cursor) throw adminError("cursor_invalid");
  }
  if (limit !== undefined) {
    const size = Number(limit);
    if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE) throw adminError("filter_invalid");
    query.limit = size;
  } else {
    query.limit = DEFAULT_PAGE;
  }
  return Object.freeze(query);
}

/** Firestore's "build the index first" answer, told apart from every other fault. */
const isMissingIndex = (error) => error?.code === 9
  || /FAILED_PRECONDITION|requires an index/i.test(String(error?.message ?? ""));

export function createAdminAnalysisReader({ firestore } = {}) {
  if (!firestore || typeof firestore.collectionGroup !== "function") {
    throw new TypeError("A Firestore instance is required.");
  }
  const { owners, analyses } = ANALYSIS_COLLECTIONS;
  const reference = (ownerKey, analysisId) => firestore.collection(owners).doc(ownerKey)
    .collection(analyses).doc(analysisId);

  return Object.freeze({
    /** One page, newest first, plus the cursor for the next one or null at the end. */
    async list(input) {
      const query = normalizeListQuery(input);
      let builder = firestore.collectionGroup(analyses);
      if (query.owner) builder = builder.where("ownerKey", "==", query.owner);
      if (query.status) builder = builder.where("status", "==", query.status);
      if (query.from) builder = builder.where("createdAt", ">=", Timestamp.fromDate(query.from));
      if (query.to) builder = builder.where("createdAt", "<", Timestamp.fromDate(query.to));
      builder = builder.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
      if (query.cursor) {
        const { seconds, nanoseconds, ownerKey, analysisId } = query.cursor;
        builder = builder.startAfter(new Timestamp(seconds, nanoseconds), reference(ownerKey, analysisId));
      }
      // One more than the page: its presence is the only fact the next
      // cursor needs, and it is never returned.
      let snapshot;
      try {
        snapshot = await builder.limit(query.limit + 1).get();
      } catch (error) {
        throw adminError(isMissingIndex(error) ? "index_unavailable" : "unexpected_server_error", error);
      }
      const documents = snapshot.docs.slice(0, query.limit);
      const rows = documents.map((document) => {
        const data = document.data() ?? {};
        return Object.freeze({
          ownerKey: KEY.test(data.ownerKey ?? "") ? data.ownerKey : document.ref.parent.parent.id,
          ...summarizeAnalysis(document.id, data)
        });
      });
      const last = rows.at(-1);
      const more = snapshot.docs.length > query.limit && last?.createdAt;
      return Object.freeze({
        analyses: rows,
        nextCursor: more ? encodeCursor({ createdAt: last.createdAt, ownerKey: last.ownerKey, analysisId: last.analysisId }) : null
      });
    },

    async read({ ownerKey, analysisId }) {
      if (!KEY.test(ownerKey ?? "") || !ID.test(analysisId ?? "")) return null;
      const snapshot = await reference(ownerKey, analysisId).get();
      return snapshot.exists ? Object.freeze({ ownerKey, ...summarizeAnalysis(analysisId, snapshot.data()) }) : null;
    }
  });
}
