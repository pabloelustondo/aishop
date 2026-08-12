export function createFirebaseVistaReservationDiagnostic(logger) {
  if (!logger || typeof logger.warn !== "function") {
    throw new TypeError("A warning logger is required.");
  }
  return (event) => logger.warn("VISTA receiving reservation resumed.", event);
}
