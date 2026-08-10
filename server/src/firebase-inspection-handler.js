import { createFirebaseServices } from "./firebase-services.js";
import { createInspectionAnalysisAdapter } from "./inspection-analysis-adapter.js";
import { createInspectionAPIHandler } from "./inspection-api-handler.js";
import { createInspectionAPIRouter } from "./inspection-api-router.js";
import { createReviewerAPIHandler } from "./reviewer-api-handler.js";
import { createInspectionSubmitter } from "./submit-inspection.js";

export function createFirebaseInspectionHandler({ apiKey, model }) {
  const services = createFirebaseServices();
  const submitInspection = createInspectionSubmitter({
    ...services,
    analyzeInspection: createInspectionAnalysisAdapter({ apiKey, model })
  });
  return createInspectionAPIRouter({
    submissionHandler: createInspectionAPIHandler({ ...services, submitInspection }),
    reviewerHandler: createReviewerAPIHandler(services)
  });
}
