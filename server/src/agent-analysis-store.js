const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const OWNERS = "agentAnalyses";
const ANALYSES = "analyses";

/**
 * Which status may become which. A run may be retried after failing, so
 * `failed` reopens; `analyzed` is terminal, because a stored report is a
 * record of what the model said and is not edited in place.
 */
const ALLOWED = Object.freeze({
  analyzing: ["uploaded", "failed"],
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

function identity(ownerKey, analysisId) {
  if (typeof ownerKey !== "string" || !OWNER_KEY.test(ownerKey)) {
    throw new TypeError("A lowercase hex owner key is required.");
  }
  if (analysisId !== undefined
    && (typeof analysisId !== "string" || !ANALYSIS_ID.test(analysisId))) {
    throw new TypeError("A server-generated analysis identifier is required.");
  }
}

function summarize(id, data) {
  return Object.freeze({
    analysisId: id,
    status: data.status ?? null,
    fileName: data.fileName ?? null,
    mediaType: data.mediaType ?? null,
    sha256: data.sha256 ?? null,
    byteLength: data.byteLength ?? null,
    createdAt: data.createdAt ?? null,
    analyzedAt: data.analyzedAt ?? null,
    failureReason: data.failureReason ?? null,
    model: data.model ?? null,
    mode: data.mode ?? null,
    report: data.report ?? null
  });
}

/**
 * The lifecycle of one uploaded analysis. Owns status and descriptors only;
 * the bytes live in the evidence store and never enter Firestore.
 *
 * Records are nested under their owner key rather than filtered by field, so
 * a query can only ever see one caller's analyses. Reaching another owner's
 * record requires naming their key, which a caller never learns.
 */
export function createAgentAnalysisStore({ firestore, serverTimestamp } = {}) {
  if (!firestore || typeof firestore.collection !== "function") {
    throw new TypeError("A Firestore instance is required.");
  }
  if (typeof serverTimestamp !== "function") {
    throw new TypeError("A server timestamp function is required.");
  }

  const analyses = (ownerKey) => firestore.collection(OWNERS)
    .doc(ownerKey).collection(ANALYSES);

  async function transition(ownerKey, analysisId, to, patch) {
    identity(ownerKey, analysisId);
    const reference = analyses(ownerKey).doc(analysisId);
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new AgentAnalysisNotFoundError();
      const from = snapshot.data()?.status ?? null;
      if (!ALLOWED[to].includes(from)) throw new AgentAnalysisStateError(from, to);
      transaction.update(reference, { ...patch, status: to });
    });
  }

  return Object.freeze({
    async create({ ownerKey, analysisId, fileName, mediaType, sha256, byteLength }) {
      identity(ownerKey, analysisId);
      const data = {
        analysisId, ownerKey, status: "uploaded",
        fileName: typeof fileName === "string" ? fileName : null,
        mediaType, sha256, byteLength,
        createdAt: serverTimestamp(),
        analyzedAt: null, failureReason: null,
        model: null, mode: null, report: null
      };
      await analyses(ownerKey).doc(analysisId).create(data);
      return Object.freeze(data);
    },

    markAnalyzing({ ownerKey, analysisId }) {
      // The previous failure reason is cleared, not kept beside a running
      // status: a record showing both would misreport the current attempt.
      return transition(ownerKey, analysisId, "analyzing", { failureReason: null });
    },

    markAnalyzed({ ownerKey, analysisId, report, model, mode }) {
      return transition(ownerKey, analysisId, "analyzed", {
        report, model: model ?? null, mode: mode ?? null,
        analyzedAt: serverTimestamp(), failureReason: null
      });
    },

    markFailed({ ownerKey, analysisId, reason }) {
      return transition(ownerKey, analysisId, "failed", {
        failureReason: typeof reason === "string" ? reason : "unknown",
        report: null, analyzedAt: serverTimestamp()
      });
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
