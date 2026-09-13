const TASK_KEYS = Object.freeze(["analysisId", "ownerKey", "runId"]);

export function readCollectionTaskPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== TASK_KEYS.join(",")) {
    throw new TypeError("The fixed collection task payload is required.");
  }
  return Object.freeze({ ownerKey: value.ownerKey, analysisId: value.analysisId,
    runId: value.runId });
}

export function createAgentCollectionTaskHandler({ collector } = {}) {
  if (typeof collector?.collect !== "function") {
    throw new TypeError("An agent analysis collector is required.");
  }
  return async request => collector.collect(readCollectionTaskPayload(request?.data));
}

export function createAgentReconciler({ dueWorkReader, taskEnqueuer,
  diagnostics = () => {} } = {}) {
  if (typeof dueWorkReader?.list !== "function") {
    throw new TypeError("An agent due-work reader is required.");
  }
  if (typeof taskEnqueuer?.enqueue !== "function") {
    throw new TypeError("An agent task enqueuer is required.");
  }
  return async () => {
    const due = await dueWorkReader.list();
    const outcomes = await Promise.allSettled(due.map(work => taskEnqueuer.enqueue(work)));
    const failures = outcomes.flatMap((outcome, index) => outcome.status === "rejected"
      ? [{ work: due[index], error: outcome.reason }] : []);
    for (const failure of failures) {
      try { diagnostics("reconciliation.dispatch_failed", {
        ownerKey: failure.work.ownerKey, analysisId: failure.work.analysisId,
        runId: failure.work.runId, failureClass: "task_dispatch_failed"
      }); } catch {}
    }
    if (failures.length > 0) {
      throw new AggregateError(failures.map(({ error }) => error),
        `Failed to dispatch ${failures.length} overdue analysis task(s).`);
    }
    return Object.freeze({ scanned: due.length, dispatched: outcomes.length });
  };
}
