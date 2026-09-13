/**
 * Every answer the All-runs routes can give when they refuse.
 *
 * Its own table, not the agent one: an administrator reading across owners
 * can be refused for reasons an uploader never meets (a bad cursor, an index
 * that has not been built), and must never see an upload code about a file
 * they did not send.
 */
const definitions = Object.freeze({
  unauthorized: [401, "Authentication is required.", false],
  forbidden: [403, "The account is not authorized to view all runs.", false],
  not_found: [404, "The requested endpoint does not exist.", false],
  method_not_allowed: [405, "That method is not supported on this path.", false],
  cursor_invalid: [400, "The page cursor is not one this server issued.", false],
  filter_invalid: [400, "A filter value is not in the accepted form.", false],
  analysis_not_found: [404, "The analysis does not exist.", false],
  storage_unavailable: [503, "Evidence storage is unavailable.", true],
  index_unavailable: [503, "The listing index is not ready on this project.", true],
  unexpected_server_error: [500, "The request could not be completed.", true]
});

export const ADMIN_API_ERROR_CODES = Object.freeze(Object.keys(definitions));

export class AdminAPIError extends Error {
  constructor(code, cause) {
    const [status, message, retryable] = definitions[code] ?? definitions.unexpected_server_error;
    super(message, cause ? { cause } : undefined);
    Object.assign(this, {
      name: "AdminAPIError",
      code: definitions[code] ? code : "unexpected_server_error",
      status, retryable
    });
  }
}

export const adminError = (code, cause) => new AdminAPIError(code, cause);

export const adminErrorBody = ({ code, message, retryable }) => Object.freeze({
  error: Object.freeze({ code, message, retryable })
});
