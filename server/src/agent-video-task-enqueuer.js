import { createHash } from "node:crypto";
import { getFunctions } from "firebase-admin/functions";

const OWNER_KEY = /^[0-9a-f]{64}$/;
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
export const AGENT_VIDEO_FUNCTION =
  "locations/northamerica-northeast1/functions/processAgentVideo";

function inputOf(value = {}) {
  const { ownerKey, analysisId } = value ?? {};
  const keys = value && typeof value === "object"
    ? Object.keys(value).sort() : [];
  if (keys.join(",") !== "analysisId,ownerKey"
    || !OWNER_KEY.test(ownerKey ?? "") || !ANALYSIS_ID.test(analysisId ?? "")) {
    throw new TypeError("A valid video processing identity is required.");
  }
  return Object.freeze({ ownerKey, analysisId });
}

const duplicate = error => error?.code === "functions/task-already-exists"
  || error?.code === "functions/already-exists" || error?.code === 6;

export function createAgentVideoTaskEnqueuer({ queue } = {}) {
  const taskQueue = queue ?? getFunctions().taskQueue(AGENT_VIDEO_FUNCTION);
  if (!taskQueue || typeof taskQueue.enqueue !== "function") {
    throw new TypeError("A Cloud Tasks queue is required.");
  }
  return Object.freeze({
    async enqueue(value) {
      const payload = inputOf(value);
      const id = `video-${createHash("sha256")
        .update(`${payload.ownerKey}:${payload.analysisId}`).digest("hex").slice(0, 48)}`;
      try {
        await taskQueue.enqueue(payload, { id, dispatchDeadlineSeconds: 540 });
        return Object.freeze({ enqueued: true, duplicate: false, taskId: id });
      } catch (error) {
        if (!duplicate(error)) throw error;
        return Object.freeze({ enqueued: false, duplicate: true, taskId: id });
      }
    }
  });
}

export function readVideoTaskPayload(value) { return inputOf(value); }
