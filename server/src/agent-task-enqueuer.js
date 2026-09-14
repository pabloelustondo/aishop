import { createHash } from "node:crypto";
import { getFunctions } from "firebase-admin/functions";

const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AGENT_COLLECTION_FUNCTION =
  "locations/northamerica-northeast1/functions/collectAgentAnalysis";
export const AGENT_TASK_DISPATCH_DEADLINE_SECONDS = 30;

function scheduledDate(value) {
  const date = value instanceof Date ? value
    : typeof value?.toDate === "function" ? value.toDate() : null;
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new TypeError("A collection due time is required.");
  }
  return date;
}

function taskInput({ ownerKey, analysisId, runId, dueAt } = {}) {
  if (typeof ownerKey !== "string" || !OWNER_KEY.test(ownerKey)) {
    throw new TypeError("A lowercase hex owner key is required.");
  }
  if (typeof analysisId !== "string" || !ANALYSIS_ID.test(analysisId)) {
    throw new TypeError("A server-generated analysis identifier is required.");
  }
  if (typeof runId !== "string" || !RUN_ID.test(runId)) {
    throw new TypeError("A run identifier is required.");
  }
  return { ownerKey, analysisId, runId, dueAt: scheduledDate(dueAt) };
}

function taskId({ ownerKey, analysisId, runId, dueAt }) {
  const key = `${ownerKey}:${analysisId}:${runId}:${dueAt.toISOString()}`;
  return `agent-${createHash("sha256").update(key).digest("hex").slice(0, 48)}`;
}

function duplicate(error) {
  return error?.code === "functions/task-already-exists"
    || error?.code === "functions/already-exists"
    || error?.code === 6;
}

/** Enqueues one idempotently named private collection task. */
export function createAgentTaskEnqueuer({ queue } = {}) {
  const taskQueue = queue ?? getFunctions().taskQueue(AGENT_COLLECTION_FUNCTION);
  if (!taskQueue || typeof taskQueue.enqueue !== "function") {
    throw new TypeError("A Cloud Tasks queue is required.");
  }

  return Object.freeze({
    async enqueue(input) {
      const normalized = taskInput(input);
      const payload = Object.freeze({ ownerKey: normalized.ownerKey,
        analysisId: normalized.analysisId, runId: normalized.runId });
      const options = { id: taskId(normalized), scheduleTime: normalized.dueAt,
        dispatchDeadlineSeconds: AGENT_TASK_DISPATCH_DEADLINE_SECONDS };
      try {
        await taskQueue.enqueue(payload, options);
        return Object.freeze({ enqueued: true, duplicate: false, taskId: options.id });
      } catch (error) {
        if (!duplicate(error)) throw error;
        return Object.freeze({ enqueued: false, duplicate: true, taskId: options.id });
      }
    }
  });
}
