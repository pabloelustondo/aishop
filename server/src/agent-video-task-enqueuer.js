import { createHash } from "node:crypto";
import { getFunctions } from "firebase-admin/functions";

const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const ATTEMPT_ID = /^[0-9A-Za-z_-]{1,64}$/;
const TASK_ID = /^video-[a-f0-9]{48}$/;
export const AGENT_VIDEO_FUNCTION =
  "locations/northamerica-northeast1/functions/processAgentVideo";

function inputOf(value = {}) {
  const { ownerKey, analysisId, attemptId } = value ?? {};
  const keys = value && typeof value === "object"
    ? Object.keys(value).sort() : [];
  if (keys.join(",") !== "analysisId,attemptId,ownerKey"
    || !OWNER_KEY.test(ownerKey ?? "") || !ANALYSIS_ID.test(analysisId ?? "")
    || !ATTEMPT_ID.test(attemptId ?? "")) {
    throw new TypeError("A valid video processing identity is required.");
  }
  return Object.freeze({ ownerKey, analysisId, attemptId });
}

const duplicate = error => error?.code === "functions/task-already-exists"
  || error?.code === "functions/already-exists" || error?.code === 6;
const missing = error => error?.code === "functions/task-not-found"
  || error?.code === "functions/not-found" || error?.code === 5;

export function createAgentVideoTaskEnqueuer({ queue } = {}) {
  const taskQueue = queue ?? getFunctions().taskQueue(AGENT_VIDEO_FUNCTION);
  if (!taskQueue || typeof taskQueue.enqueue !== "function") {
    throw new TypeError("A Cloud Tasks queue is required.");
  }
  return Object.freeze({
    async enqueue(value) {
      const payload = inputOf(value);
      const id = `video-${createHash("sha256")
        .update(`${payload.ownerKey}:${payload.analysisId}:${payload.attemptId}`)
        .digest("hex").slice(0, 48)}`;
      try {
        await taskQueue.enqueue(payload, { id, dispatchDeadlineSeconds: 540 });
        return Object.freeze({ enqueued: true, duplicate: false,
          taskId: id, taskName: id });
      } catch (error) {
        if (!duplicate(error)) throw error;
        return Object.freeze({ enqueued: false, duplicate: true,
          taskId: id, taskName: id });
      }
    },
    async delete(taskName) {
      if (!TASK_ID.test(taskName ?? "") || typeof taskQueue.delete !== "function") {
        throw new TypeError("A deletable video task identity is required.");
      }
      try {
        await taskQueue.delete(taskName);
        return Object.freeze({ deleted: true });
      } catch (error) {
        if (missing(error)) return Object.freeze({ deleted: false, reason: "not-found" });
        throw error;
      }
    }
  });
}

export function readVideoTaskPayload(value) { return inputOf(value); }
