import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import {
  createAdminAnalysisReader, decodeCursor, encodeCursor, normalizeListQuery, DEFAULT_PAGE
} from "../src/admin-analysis-reader.js";
import { AdminAPIError } from "../src/admin-api-error.js";

const OWNER_A = "a".repeat(64), OWNER_B = "b".repeat(64);
const ID = (n) => `id${String(n).padStart(30, "0")}`;

function firestoreDouble(docs, { fail } = {}) {
  const chain = [];
  const query = {
    where: (...args) => { chain.push(["where", ...args]); return query; },
    orderBy: (field, direction) => { chain.push(["orderBy", typeof field === "string" ? field : "__name__", direction]); return query; },
    startAfter: (...args) => { chain.push(["startAfter", ...args]); return query; },
    limit: (n) => { chain.push(["limit", n]); return query; },
    get: async () => { if (fail) throw fail; return { docs: docs.slice(0, chain.find(([k]) => k === "limit")[1]) }; }
  };
  const firestore = {
    collectionGroup: (name) => { chain.push(["collectionGroup", name]); return query; },
    collection: (owners) => ({ doc: (ownerKey) => ({ collection: () => ({ doc: (id) => ({
      path: `${owners}/${ownerKey}/analyses/${id}`,
      get: async () => {
        const found = docs.find((d) => d.ownerKey === ownerKey && d.id === id);
        return { exists: Boolean(found), data: () => found?.data() };
      }
    }) }) }) })
  };
  return { firestore, chain };
}

const doc = (ownerKey, n, createdAt, extra = {}) => ({
  id: ID(n), ownerKey,
  ref: { parent: { parent: { id: ownerKey } } },
  data: () => ({ ownerKey, status: "analyzed", createdAt, runs: [], ...extra })
});

const codeOf = (fn) => { try { fn(); return null; } catch (error) { assert.ok(error instanceof AdminAPIError); return error.code; } };

test("a cursor round-trips and anything the server did not issue is refused", () => {
  const cursor = encodeCursor({ createdAt: new Timestamp(1_700_000_000, 5000), ownerKey: OWNER_A, analysisId: ID(1) });
  assert.deepEqual(decodeCursor(cursor), { seconds: 1_700_000_000, nanoseconds: 5000, ownerKey: OWNER_A, analysisId: ID(1) });
  for (const bad of ["", "not-base64!", Buffer.from("[]").toString("base64url"),
    Buffer.from(JSON.stringify({ s: -1, n: 0, o: OWNER_A, a: "x" })).toString("base64url"),
    Buffer.from(JSON.stringify({ s: 1, n: 0, o: "short", a: "x" })).toString("base64url"),
    Buffer.from(JSON.stringify({ s: 1, n: 0, o: OWNER_A, a: "../x" })).toString("base64url")]) {
    assert.equal(decodeCursor(bad), null, bad);
  }
  assert.equal(codeOf(() => normalizeListQuery({ cursor: "nope" })), "cursor_invalid");
});

test("filters are validated to their exact forms and days are half-open UTC intervals", () => {
  const query = normalizeListQuery({ owner: OWNER_A, status: "failed", from: "2026-09-01", to: "2026-09-10", limit: "5" });
  assert.equal(query.owner, OWNER_A);
  assert.equal(query.status, "failed");
  assert.equal(query.from.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(query.to.toISOString(), "2026-09-11T00:00:00.000Z", "`to` includes the whole day named");
  assert.equal(query.limit, 5);
  assert.equal(normalizeListQuery({}).limit, DEFAULT_PAGE);
  for (const bad of [{ owner: "someone@example.com" }, { status: "done" }, { from: "2026-02-30" },
    { from: "yesterday" }, { from: "2026-09-10", to: "2026-09-01" }, { limit: 0 }, { limit: 51 }, { limit: "many" }]) {
    assert.equal(codeOf(() => normalizeListQuery(bad)), "filter_invalid", JSON.stringify(bad));
  }
});

test("lists newest first with a document-path tie-breaker and pages by one extra row", async () => {
  const t = new Timestamp(1_700_000_000, 0);
  const { firestore, chain } = firestoreDouble([doc(OWNER_A, 3, t), doc(OWNER_B, 2, t), doc(OWNER_A, 1, t)]);
  const reader = createAdminAnalysisReader({ firestore });

  const page = await reader.list({ limit: 2 });
  assert.deepEqual(chain.slice(0, 3), [["collectionGroup", "analyses"], ["orderBy", "createdAt", "desc"], ["orderBy", "__name__", "desc"]]);
  assert.deepEqual(chain.at(-1), ["limit", 3], "one more than the page decides whether a next cursor exists");
  assert.equal(page.analyses.length, 2);
  assert.deepEqual(page.analyses.map((row) => row.ownerKey), [OWNER_A, OWNER_B], "the owner rides on every row");
  assert.deepEqual(decodeCursor(page.nextCursor), { seconds: 1_700_000_000, nanoseconds: 0, ownerKey: OWNER_B, analysisId: ID(2) });

  const next = firestoreDouble([doc(OWNER_A, 1, t)]);
  const last = await createAdminAnalysisReader({ firestore: next.firestore }).list({ limit: 2, cursor: page.nextCursor });
  const start = next.chain.find(([k]) => k === "startAfter");
  assert.ok(start[1] instanceof Timestamp && start[1].seconds === 1_700_000_000);
  assert.equal(start[2].path, `agentAnalyses/${OWNER_B}/analyses/${ID(2)}`);
  assert.equal(last.analyses.length, 1);
  assert.equal(last.nextCursor, null, "the last page carries no cursor");
});

test("filters become equality and range clauses on the collection group", async () => {
  const { firestore, chain } = firestoreDouble([]);
  await createAdminAnalysisReader({ firestore }).list({ owner: OWNER_A, status: "failed", from: "2026-09-01", to: "2026-09-02" });
  const wheres = chain.filter(([k]) => k === "where").map(([, field, op, value]) =>
    [field, op, value instanceof Timestamp ? value.toDate().toISOString() : value]);
  assert.deepEqual(wheres, [
    ["ownerKey", "==", OWNER_A], ["status", "==", "failed"],
    ["createdAt", ">=", "2026-09-01T00:00:00.000Z"], ["createdAt", "<", "2026-09-03T00:00:00.000Z"]
  ]);
});

test("a legacy record answers with nulls, never invented fields", async () => {
  const { firestore } = firestoreDouble([doc(OWNER_A, 1, new Timestamp(1, 0), { width: undefined, report: undefined, mode: undefined })]);
  const [row] = (await createAdminAnalysisReader({ firestore }).list({})).analyses;
  assert.equal(row.width, null); assert.equal(row.report, null); assert.equal(row.mode, null);
  assert.equal(row.runCount, 0);
});

test("a missing index is a retryable 503 with its own code; any other fault is 500", async () => {
  const missing = firestoreDouble([], { fail: Object.assign(new Error("9 FAILED_PRECONDITION: The query requires an index."), { code: 9 }) });
  await assert.rejects(createAdminAnalysisReader({ firestore: missing.firestore }).list({}),
    (error) => error.code === "index_unavailable" && error.status === 503 && error.retryable === true);
  const broken = firestoreDouble([], { fail: new Error("socket hang up") });
  await assert.rejects(createAdminAnalysisReader({ firestore: broken.firestore }).list({}),
    (error) => error.code === "unexpected_server_error");
});

test("read answers one owner's record or null, and refuses a malformed pair before any lookup", async () => {
  const { firestore } = firestoreDouble([doc(OWNER_A, 1, new Timestamp(1, 0))]);
  const reader = createAdminAnalysisReader({ firestore });
  assert.equal((await reader.read({ ownerKey: OWNER_A, analysisId: ID(1) })).ownerKey, OWNER_A);
  assert.equal(await reader.read({ ownerKey: OWNER_B, analysisId: ID(1) }), null);
  assert.equal(await reader.read({ ownerKey: "nope", analysisId: ID(1) }), null);
  assert.equal(await reader.read({ ownerKey: OWNER_A, analysisId: "../escape" }), null);
});
