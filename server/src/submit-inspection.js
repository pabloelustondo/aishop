import { randomUUID } from "node:crypto";
import { InspectionOperationError, ProviderError } from "./errors.js";
import { validateInspectionSubmission } from "./inspection-submission.js";

export function createInspectionSubmitter({
  evidenceStore, analyzeInspection, recordStore, createScanId = randomUUID
}) {
  return async function submit(body) {
    const submission = validateInspectionSubmission(body);
    const scanId = createScanId();
    let evidence;
    try {
      evidence = await evidenceStore.preserveOriginal({
        scanId,
        imageBase64: submission.imageBase64
      });
    } catch (error) {
      throw new InspectionOperationError("evidence", error);
    }
    const record = {
      scanId,
      mode: submission.mode,
      appVersion: submission.appVersion,
      targetPosition: submission.targetPosition,
      evidence
    };
    try {
      const report = await analyzeInspection(submission);
      try {
        await recordStore.createInitial({ ...record, initialFindings: report });
      } catch (error) {
        throw new InspectionOperationError("record", error);
      }
      return Object.freeze({ scanId, mode: submission.mode, report });
    } catch (error) {
      if (error instanceof ProviderError) {
        try {
          await recordStore.createFailure({
            ...record,
            failure: { stage: "analysis", code: error.kind }
          });
        } catch (recordError) {
          throw new InspectionOperationError("record", recordError);
        }
      }
      throw error;
    }
  };
}
