const VISTA_PACKAGE_PATH = "/v1/vista/inspection-packages";

export function createFirebaseAPIRouter({
  vistaHandler, vistaReadHandler, inspectionHandler, legacyHandler
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
    } else if (request.url.startsWith("/inspections")) {
      await inspectionHandler(request, response);
    } else {
      await legacyHandler(request, response);
    }
  };
}
