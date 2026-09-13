import { randomUUID } from "node:crypto";
import { sanitizeDiagnostics } from "./agent-diagnostics.js";
const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const PROVIDER_RESPONSE_ID = /^resp_[A-Za-z0-9_-]{1,120}$/;
export const COLLECTION_INTERVAL_MS = 15_000;
export const COLLECTION_LEASE_MS = 30_000;
const dimension = value => Number.isInteger(value) && value > 0 && value <= 4096 ? value : null;
const OWNERS = "agentAnalyses";
const ANALYSES = "analyses";
/** Where the records live, for the one reader that spans owners (Sprint 012). */
export const ANALYSIS_COLLECTIONS = Object.freeze({ owners: OWNERS, analyses: ANALYSES });

/**
 * How many times one uploaded image may be analysed.
 *
 * The run history lives inside the record, and a Firestore document is capped
 * at 1 MiB. A full 40-product report is a few kilobytes, so this ceiling sits
 * far below the document limit while still refusing an unbounded loop with a
 * stable code rather than an opaque provider or storage error.
 */
export const MAX_ANALYSIS_RUNS = 25;

/**
 * Which status may become which.
 *
 * `analyzing` reopens from every settled status, but for two different
 * reasons. From `failed` it is a retry: the same input, justified because
 * nothing was produced. From `analyzed` it is a refine, which only earns its
 * cost because the input differs — a context note the caller supplies. The
 * store does not enforce that distinction; it records which run carried what,
 * so a report is always readable beside the instruction that produced it.
 */
const ALLOWED = Object.freeze({
  analyzing: ["uploaded", "failed", "analyzed"],
  analyzed: ["analyzing"],
  failed: ["analyzing"]
});

export class AgentAnalysisNotFoundError extends Error {
  constructor() {
    super("Analysis not found.");
    this.name = "AgentAnalysisNotFoundError";
    this.code = "analysis_not_found";
  }
}

export class AgentAnalysisStateError extends Error {
  constructor(from, to) {
    super(`An analysis cannot move from ${from} to ${to}.`);
    this.name = "AgentAnalysisStateError";
    this.code = "analysis_state_invalid";
    this.from = from;
    this.to = to;
  }
}

/**
 * A refine was asked for without saying what to refine.
 *
 * Enforced here rather than only in the page, because the page is not the
 * enforcement point: reopening an `analyzed` record without a note would
 * repeat an identical question at full price, and any caller can do that.
 */
export class AgentAnalysisContextRequiredError extends Error {
  constructor() {
    super("Re-analysing a completed analysis requires a note.");
    this.name = "AgentAnalysisContextRequiredError";
    this.code = "context_required";
  }
}

export class AgentAnalysisRunLimitError extends Error {
  constructor(limit) {
    super(`An analysis may be run at most ${limit} times.`);
    this.name = "AgentAnalysisRunLimitError";
    this.code = "analysis_run_limit";
    this.limit = limit;
  }
}

function identity(ownerKey, analysisId) {
  if (typeof ownerKey !== "string" || !OWNER_KEY.test(ownerKey)) {
    throw new TypeError("A lowercase hex owner key is required.");
  }
  if (analysisId !== undefined
    && (typeof analysisId !== "string" || !ANALYSIS_ID.test(analysisId))) {
    throw new TypeError("A server-generated analysis identifier is required.");
  }
}

/** A note is an instruction or it is absent; whitespace is neither. */
function note(context) {
  return typeof context === "string" && context.trim() !== "" ? context.trim() : null;
}

const runsOf = (data) => (Array.isArray(data?.runs) ? data.runs : []);
const diagnosticSummary = (value) => {
  const { responseId: _privateResponseId, ...safe } = sanitizeDiagnostics(value);
  return {
    imageWidth: null, imageHeight: null, imageByteLength: null,
    returnedModel: null, usage: null, providerRequestId: null,
    providerStatus: null, responseStatus: null, incompleteReason: null,
    ...safe
  };
};

function publicRun(run) {
  const { providerResponseId: _privateProviderResponseId, ...safe } = run ?? {};
  return Object.freeze({ ...safe,
    diagnostics: safe.diagnostics ? diagnosticSummary(safe.diagnostics) : null });
}

/** The record as every reader answers it; exported so the admin reader answers identically. */
export function summarizeAnalysis(id, data) { return summarize(id, data); }

function summarize(id, data) {
  const runs = runsOf(data);
  return Object.freeze({
    analysisId: id,
    status: data.status ?? null,
    fileName: data.fileName ?? null,
    mediaType: data.mediaType ?? null,
    sha256: data.sha256 ?? null,
    byteLength: data.byteLength ?? null,
    width: dimension(data.width), height: dimension(data.height),
    createdAt: data.createdAt ?? null,
    analyzedAt: data.analyzedAt ?? null,
    failureReason: data.failureReason ?? null,
    model: data.model ?? null,
    mode: data.mode ?? null,
    // The most recent completed run's report, kept at the top level so the
    // list has one field to render. `runs` is where the history is.
    report: data.report ?? null,
    runCount: runs.length,
    runs: runs.map(publicRun)
  });
}

/**
 * The lifecycle of one uploaded analysis. Owns status and descriptors only;
 * the bytes live in the evidence store and never enter Firestore.
 *
 * Records are nested under their owner key rather than filtered by field, so
 * a query can only ever see one caller's analyses. Reaching another owner's
 * record requires naming their key, which a caller never learns.
 *
 * `serverTimestamp` and `clock` are both required because they are not
 * interchangeable: Firestore rejects a server-timestamp sentinel written
 * inside an array element, so the run entries carry a concrete time while the
 * record's own timestamps stay server-authored.
 */
export function createAgentAnalysisStore({
  firestore, serverTimestamp, clock = () => new Date(), collectionClock = () => new Date()
} = {}) {
  if (!firestore || typeof firestore.collection !== "function") {
    throw new TypeError("A Firestore instance is required.");
  }
  if (typeof serverTimestamp !== "function") {
    throw new TypeError("A server timestamp function is required.");
  }
  if (typeof clock !== "function") {
    throw new TypeError("A clock is required.");
  }
  if (typeof collectionClock !== "function") {
    throw new TypeError("A collection clock is required.");
  }

  const collectionNow = () => {
    const value = collectionClock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("The collection clock must return a Date.");
    }
    return value;
  };
  const instant = (value) => value instanceof Date ? value.getTime()
    : typeof value?.toMillis === "function" ? value.toMillis()
      : typeof value?.toDate === "function" ? value.toDate().getTime() : null;

  const analyses = (ownerKey) => firestore.collection(OWNERS)
    .doc(ownerKey).collection(ANALYSES);

  /**
   * Closes the run that is currently open. A record that reached `analyzing`
   * always has one, because that is the only transition that opens one; the
   * empty case is covered rather than assumed so a settled outcome is never
   * dropped on the floor.
   */
  function closeOpenRun(data, outcome, runId) {
    const runs = [...runsOf(data)];
    const open = runs.length > 0
      ? runs[runs.length - 1]
      : { runNumber: 1, context: null, startedAt: null };
    if (runId && open.runId !== runId) throw new AgentAnalysisStateError("stale-run", "settled");
    const closed = { ...open, ...outcome, diagnostics: diagnosticSummary({ ...open.diagnostics, ...outcome.diagnostics }), endedAt: clock() };
    if (runs.length > 0) runs[runs.length - 1] = closed; else runs.push(closed);
    return runs;
  }

  async function transition(ownerKey, analysisId, to, patch, expectedRunId = null) {
    identity(ownerKey, analysisId);
    const reference = analyses(ownerKey).doc(analysisId);
    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
      const data = snapshot.data() ?? {};
      const from = data.status ?? null;
      const currentRun = runsOf(data).at(-1);
      if (from === to && expectedRunId && currentRun?.runId === expectedRunId
        && currentRun?.status === to && (to === "analyzed" || to === "failed")) {
        return currentRun;
      }
      if (!ALLOWED[to].includes(from)) throw new AgentAnalysisStateError(from, to);
      const update = patch(data);
      transaction.update(reference, { ...update, status: to,
        collectionDueAt: null, collectionLeaseUntil: null });
      return update.runs?.at(-1);
    });
  }

  return Object.freeze({
    async create({ ownerKey, analysisId, fileName, mediaType, sha256, byteLength, width, height }) {
      identity(ownerKey, analysisId);
      const data = {
        analysisId, ownerKey, status: "uploaded",
        fileName: typeof fileName === "string" ? fileName : null,
        mediaType, sha256, byteLength, width: dimension(width), height: dimension(height),
        createdAt: serverTimestamp(),
        analyzedAt: null, failureReason: null,
        model: null, mode: null, report: null,
        providerResponseId: null, providerRunId: null,
        collectionDueAt: null, collectionLeaseUntil: null,
        runs: []
      };
      await analyses(ownerKey).doc(analysisId).create(data);
      return Object.freeze(data);
    },

    /**
     * Opens a run. A retry after failure carries no context; a refine of an
     * analyzed record is worth its cost only because it does.
     *
     * The previous failure reason is cleared, not kept beside a running
     * status: a record showing both would misreport the current attempt. The
     * previous *report* is left in place so the record keeps the last
     * completed answer until a new one settles. The page does not currently
     * render it during `analyzing`; showing prior rows while a refine runs is
     * an open UI proposal, not a promise this store keeps.
     */
    markAnalyzing({ ownerKey, analysisId, context, diagnostics = {} }) {
      const runId = randomUUID();
      return transition(ownerKey, analysisId, "analyzing", (data) => {
        const runs = runsOf(data);
        const asked = note(context);
        // Reopening from `analyzed` is a refine, and a refine earns its cost
        // only because the input differs. From `uploaded` or `failed` nothing
        // was produced, so the same input is worth sending and no note is
        // required.
        if (data.status === "analyzed" && asked === null) {
          throw new AgentAnalysisContextRequiredError();
        }
        if (runs.length >= MAX_ANALYSIS_RUNS) {
          throw new AgentAnalysisRunLimitError(MAX_ANALYSIS_RUNS);
        }
        return {
          failureReason: null,
          providerResponseId: null, providerRunId: null,
          collectionDueAt: null, collectionLeaseUntil: null,
          runs: [...runs, {
            runId,
            trigger: data.status === "uploaded" ? "initial" : data.status === "failed" ? "retry" : "refine",
            diagnostics: diagnosticSummary({ ...diagnostics,
              imageWidth: dimension(data.width), imageHeight: dimension(data.height),
              imageByteLength: data.byteLength ?? null
            }),
            runNumber: runs.length + 1,
            context: asked,
            status: "analyzing",
            startedAt: clock(),
            endedAt: null,
            report: null, model: null, mode: null, failureReason: null
          }]
        };
      });
    },

    async markProviderStarted({ ownerKey, analysisId, runId, responseId, diagnostics = {} }) {
      identity(ownerKey, analysisId);
      if (typeof responseId !== "string" || !PROVIDER_RESPONSE_ID.test(responseId)) {
        throw new TypeError("A provider response identifier is required.");
      }
      const reference = analyses(ownerKey).doc(analysisId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
        const data = snapshot.data() ?? {};
        if (data.status !== "analyzing") throw new AgentAnalysisStateError(data.status ?? null, "provider-started");
        const runs = [...runsOf(data)];
        const current = runs.at(-1);
        if (!current || current.runId !== runId) throw new AgentAnalysisStateError("stale-run", "provider-started");
        if (data.providerRunId && (data.providerRunId !== runId || data.providerResponseId !== responseId)) {
          throw new AgentAnalysisStateError("different-provider-response", "provider-started");
        }
        runs[runs.length - 1] = { ...current,
          diagnostics: diagnosticSummary({ ...current.diagnostics, ...diagnostics }) };
        const dueAt = new Date(collectionNow().getTime() + COLLECTION_INTERVAL_MS);
        transaction.update(reference, { runs, providerResponseId: responseId,
          providerRunId: runId, collectionDueAt: dueAt, collectionLeaseUntil: null });
        return Object.freeze({ runId, responseId, dueAt });
      });
    },

    async readPending({ ownerKey, analysisId }) {
      identity(ownerKey, analysisId);
      const snapshot = await analyses(ownerKey).doc(analysisId).get();
      if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
      const data = snapshot.data() ?? {};
      const current = runsOf(data).at(-1) ?? {};
      return Object.freeze({
        status: data.status ?? null,
        runId: current.runId ?? null,
        responseId: data.providerRunId === current.runId ? data.providerResponseId ?? null : null,
        dueAt: data.collectionDueAt ?? null,
        leaseUntil: data.collectionLeaseUntil ?? null,
        context: current.context ?? null,
        runNumber: current.runNumber ?? null,
        diagnostics: diagnosticSummary(current.diagnostics)
      });
    },

    async claimCollection({ ownerKey, analysisId, runId }) {
      identity(ownerKey, analysisId);
      const reference = analyses(ownerKey).doc(analysisId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
        const data = snapshot.data() ?? {};
        const current = runsOf(data).at(-1) ?? {};
        if (data.status !== "analyzing") return Object.freeze({ claimed: false, reason: "terminal" });
        if (current.runId !== runId || data.providerRunId !== runId) {
          return Object.freeze({ claimed: false, reason: "stale-run" });
        }
        if (!PROVIDER_RESPONSE_ID.test(data.providerResponseId ?? "")) {
          return Object.freeze({ claimed: false, reason: "provider-missing" });
        }
        const now = collectionNow();
        const leaseUntil = instant(data.collectionLeaseUntil);
        if (leaseUntil !== null && leaseUntil > now.getTime()) {
          return Object.freeze({ claimed: false, reason: "leased" });
        }
        const dueAt = instant(data.collectionDueAt);
        if (dueAt !== null && dueAt > now.getTime()) {
          return Object.freeze({ claimed: false, reason: "not-due" });
        }
        const nextLease = new Date(now.getTime() + COLLECTION_LEASE_MS);
        transaction.update(reference, { collectionLeaseUntil: nextLease });
        return Object.freeze({ claimed: true, ownerKey, analysisId, runId,
          responseId: data.providerResponseId, leaseUntil: nextLease,
          diagnostics: diagnosticSummary(current.diagnostics) });
      });
    },

    async rescheduleCollection({ ownerKey, analysisId, runId, diagnostics = {} }) {
      identity(ownerKey, analysisId);
      const reference = analyses(ownerKey).doc(analysisId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
        const data = snapshot.data() ?? {};
        const runs = [...runsOf(data)];
        const current = runs.at(-1);
        if (data.status !== "analyzing" || current?.runId !== runId || data.providerRunId !== runId) {
          return Object.freeze({ scheduled: false, reason: "stale-run" });
        }
        runs[runs.length - 1] = { ...current,
          diagnostics: diagnosticSummary({ ...current.diagnostics, ...diagnostics }) };
        const dueAt = new Date(collectionNow().getTime() + COLLECTION_INTERVAL_MS);
        transaction.update(reference, { runs, collectionDueAt: dueAt, collectionLeaseUntil: null });
        return Object.freeze({ scheduled: true, dueAt });
      });
    },

    markAnalyzed({ ownerKey, analysisId, report, model, mode, runId, diagnostics = {} }) {
      return transition(ownerKey, analysisId, "analyzed", (data) => ({
        report, model: model ?? null, mode: mode ?? null,
        analyzedAt: serverTimestamp(), failureReason: null,
        runs: closeOpenRun(data, {
          status: "analyzed", report, diagnostics: diagnosticSummary(diagnostics),
          model: model ?? null, mode: mode ?? null, failureReason: null
        }, runId)
      }), runId);
    },

    markFailed({ ownerKey, analysisId, reason, runId, diagnostics = {} }) {
      const failureReason = typeof reason === "string" ? reason : "unknown";
      return transition(ownerKey, analysisId, "failed", (data) => ({
        failureReason, report: null, analyzedAt: serverTimestamp(),
        runs: closeOpenRun(data, { status: "failed", failureReason, report: null, diagnostics: diagnosticSummary(diagnostics) }, runId)
      }), runId);
    },

    async read({ ownerKey, analysisId }) {
      identity(ownerKey, analysisId);
      const snapshot = await analyses(ownerKey).doc(analysisId).get();
      return snapshot.exists ? summarize(analysisId, snapshot.data()) : null;
    },

    async list({ ownerKey, limit = 100 }) {
      identity(ownerKey);
      const snapshot = await analyses(ownerKey)
        .orderBy("createdAt", "desc").limit(limit).get();
      return snapshot.docs.map((document) => summarize(document.id, document.data()));
    }
  });
}
