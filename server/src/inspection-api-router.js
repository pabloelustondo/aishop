export function createInspectionAPIRouter({ submissionHandler, reviewerHandler }) {
  return async function route(request, response) {
    const submission = request.method === "POST" && request.url === "/inspections";
    const evidence = request.method === "GET" && request.url.endsWith("/evidence");
    const handler = submission || evidence ? submissionHandler : reviewerHandler;
    await handler(request, response);
  };
}
