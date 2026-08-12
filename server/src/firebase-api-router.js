const VISTA_PACKAGE_PATH = "/v1/vista/inspection-packages";

export function createFirebaseAPIRouter({
  vistaHandler, inspectionHandler, legacyHandler
}) {
  return async function routeFirebaseAPI(request, response) {
    if (request.method === "POST" && request.url === VISTA_PACKAGE_PATH) {
      await vistaHandler(request, response);
    } else if (request.url.startsWith("/inspections")) {
      await inspectionHandler(request, response);
    } else {
      await legacyHandler(request, response);
    }
  };
}
