import http from "node:http";
import { isAuthorized, requireClientToken } from "./client-auth.js";
import { ClientError, ERROR_MESSAGES, ProviderError } from "./errors.js";
import { MAX_IMAGE_BYTES, validateImageInput } from "./image-input.js";

export const MAX_REQUEST_BYTES = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4096;

function sendJson(response, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders
  });
  response.end(body);
}

async function readJson(request, maxRequestBytes) {
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
    throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
  }

  const preparedBody = request.rawBody ?? request.body;
  if (preparedBody !== undefined) {
    let bytes;
    try {
      bytes = Buffer.isBuffer(preparedBody)
        ? preparedBody
        : Buffer.from(typeof preparedBody === "string"
          ? preparedBody
          : JSON.stringify(preparedBody));
    } catch {
      throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
    }
    if (bytes.length > maxRequestBytes) {
      throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
    }
    try {
      return JSON.parse(bytes.toString("utf8"));
    } catch {
      throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
    }
  }

  let byteLength = 0;
  const chunks = [];
  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > maxRequestBytes) {
      throw new ClientError(413, ERROR_MESSAGES.imageTooLarge);
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ClientError(400, ERROR_MESSAGES.invalidRequest);
  }
}

function handleError(error, response, logger) {
  if (error instanceof ClientError) {
    sendJson(response, error.status, { error: error.message });
    return;
  }
  if (error instanceof ProviderError) {
    logger.error(`OpenAI request failed (${error.kind}).`);
    const status = error.kind === "timeout" ? 504 : 502;
    sendJson(response, status, { error: ERROR_MESSAGES.analysisFailed });
    return;
  }

  logger.error("Unexpected product-analysis failure.");
  sendJson(response, 500, { error: ERROR_MESSAGES.analysisFailed });
}

export function createRequestHandler({
  analyzeProduct,
  clientToken,
  logger = console,
  maxRequestBytes = MAX_REQUEST_BYTES
}) {
  if (typeof analyzeProduct !== "function") {
    throw new TypeError("analyzeProduct must be a function.");
  }
  requireClientToken(clientToken);

  return async function handleRequest(request, response) {
    if (request.url === "/health" && request.method === "GET") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.url === "/analyze-product" && request.method !== "POST") {
      sendJson(response, 405, { error: ERROR_MESSAGES.notFound }, { Allow: "POST" });
      return;
    }

    if (request.url !== "/analyze-product") {
      sendJson(response, 404, { error: ERROR_MESSAGES.notFound });
      return;
    }

    if (!isAuthorized(request.headers.authorization, clientToken)) {
      sendJson(
        response,
        401,
        { error: ERROR_MESSAGES.unauthorized },
        { "WWW-Authenticate": "Bearer" }
      );
      return;
    }

    const contentType = request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") {
      sendJson(response, 415, { error: ERROR_MESSAGES.invalidRequest });
      return;
    }

    try {
      const body = await readJson(request, maxRequestBytes);
      const image = validateImageInput(body);
      const message = await analyzeProduct(image);
      sendJson(response, 200, { message });
    } catch (error) {
      handleError(error, response, logger);
    }
  };
}

export function createHttpServer(options) {
  return http.createServer(createRequestHandler(options));
}
