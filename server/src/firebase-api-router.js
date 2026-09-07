const VISTA_PACKAGE_PATH = "/v1/vista/inspection-packages";
const AGENT_PATH = "/v1/agent";

/** The namespace, not a prefix: `/v1/agentine` is somebody else's path. */
const isAgentPath = (url) => url === AGENT_PATH || url.startsWith(`${AGENT_PATH}/`);

export function createFirebaseAPIRouter({
  vistaHandler, vistaReadHandler, agentHandler, inspectionHandler, legacyHandler
}) {
  return async function routeFirebaseAPI(request, response) {
    if (request.method === "POST" && request.url === VISTA_PACKAGE_PATH) {
      await vistaHandler(request, response);
    } else if (
      // Ingest owns POST on the collection itself and nothing else. Sub-paths
      // go to the read handler, whose own dispatch decides which methods each
      // one accepts — analysis is a POST against a single artifact.
      vistaReadHandler
      && (request.method === "GET"
        || (request.method === "POST" && request.url.startsWith(`${VISTA_PACKAGE_PATH}/`)))
      && request.url.startsWith(VISTA_PACKAGE_PATH)
    ) {
      await vistaReadHandler(request, response);
    } else if (agentHandler && isAgentPath(request.url)) {
      // Every method and every sub-path, including the ones it does not
      // serve. A caller inside this namespace gets the agent handler's own
      // 404 and 405 rather than the legacy handler's, so one endpoint answers
      // in one error shape.
      await agentHandler(request, response);
    } else if (request.url.startsWith("/inspections")) {
      await inspectionHandler(request, response);
    } else {
      await legacyHandler(request, response);
    }
  };
}
