/**
 * Every answer this endpoint can give when it refuses.
 *
 * Deliberately its own table rather than the VISTA one. That table describes
 * a sealed multi-artifact package — manifests, audit chains, idempotency
 * keys — none of which exist here, and sharing it would mean a browser
 * upload could return a code about a manifest it never sent.
 *
 * `retryable` says whether repeating the identical request could succeed. It
 * is a promise to the page about what a retry button is worth, so a caller's
 * own mistake is never marked retryable.
 */
const definitions = Object.freeze({
  unauthorized: [401, "Authentication is required.", false],
  // A verified account that Pablo has not authorized for the agent. Distinct
  // from `unauthorized`: the caller's credential is fine, the account is not
  // on the list, and repeating the request changes nothing.
  forbidden: [403, "The account is not authorized for the agent.", false],
  not_found: [404, "The requested endpoint does not exist.", false],
  method_not_allowed: [405, "That method is not supported on this path.", false],
  multipart_invalid: [400, "The upload could not be read.", false],
  file_missing: [400, "One image file part is required.", false],
  file_count_invalid: [400, "Exactly one image file part is required.", false],
  file_not_jpeg: [400, "The uploaded file is not a valid JPEG.", false],
  file_dimensions_invalid: [400, "The image dimensions are outside the accepted range.", false],
  file_too_large: [413, "The image is too large.", false],
  media_type_unsupported: [415, "The image media type is unsupported.", false],
  context_invalid: [400, "The analysis note is invalid.", false],
  context_required: [400, "Re-analysing a completed analysis requires a note saying what to do differently.", false],
  analysis_not_found: [404, "The analysis does not exist.", false],
  analysis_state_invalid: [409, "The analysis is not in a state that allows that.", false],
  analysis_run_limit: [409, "The analysis has already been run the maximum number of times.", false],
  source_exists: [409, "Source evidence already exists for this analysis.", false],
  storage_unavailable: [503, "Evidence storage is unavailable.", true],
  provider_timeout: [504, "The analysis provider did not answer in time.", true],
  provider_failed: [502, "The analysis provider failed.", true],
  unexpected_server_error: [500, "The request could not be completed.", true]
});

export const AGENT_API_ERROR_CODES = Object.freeze(Object.keys(definitions));

export class AgentAPIError extends Error {
  constructor(code, cause) {
    // An unrecognised code is a bug in this server, not a fact about the
    // request, so it degrades to the generic answer rather than throwing
    // while already handling an error.
    const [status, message, retryable] = definitions[code]
      ?? definitions.unexpected_server_error;
    super(message, cause ? { cause } : undefined);
    Object.assign(this, {
      name: "AgentAPIError",
      code: definitions[code] ? code : "unexpected_server_error",
      status, retryable
    });
  }
}

export const agentError = (code, cause) => new AgentAPIError(code, cause);

/**
 * The body a caller sees. The cause never reaches it: a provider or storage
 * message can carry a bucket name, a URL, or a key fragment.
 */
export const agentErrorBody = ({ code, message, retryable }) => Object.freeze({
  error: Object.freeze({ code, message, retryable })
});
