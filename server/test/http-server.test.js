import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ERROR_MESSAGES, ProviderError } from "../src/errors.js";
import { createHttpServer, createRequestHandler } from "../src/http-server.js";
import { createOpenAIAnalyzer } from "../src/openai-analyzer.js";

const tinyJpegBase64 = readFileSync(
  new URL("../test-fixtures/tiny.jpg.base64", import.meta.url),
  "utf8"
).replace(/\s+/g, "");

const validBody = { imageBase64: tinyJpegBase64, mediaType: "image/jpeg" };
const silentLogger = { error() {} };
const clientToken = "test-client-token";

async function startServer(t, options) {
  const server = createHttpServer({ clientToken, logger: silentLogger, ...options });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function postJson(url, body, authorization = `Bearer ${clientToken}`) {
  const headers = { "Content-Type": "application/json" };
  if (authorization !== null) headers.Authorization = authorization;
  return fetch(`${url}/analyze-product`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

test("health endpoint is small and does not add browser CORS headers", async (t) => {
  const url = await startServer(t, { analyzeProduct: async () => "unused" });
  const response = await fetch(`${url}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("runs the complete route with a mocked OpenAI request", async (t) => {
  const fetchImpl = async () => new Response(JSON.stringify({
    output: [{
      type: "message",
      content: [{ type: "output_text", text: "These are red tomatoes." }]
    }]
  }), { status: 200, headers: { "Content-Type": "application/json" } });
  const analyzeProduct = createOpenAIAnalyzer({ apiKey: "test-api-key", fetchImpl });
  const url = await startServer(t, { analyzeProduct });

  const response = await postJson(url, validBody);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: "These are red tomatoes." });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("accepts Firebase's pre-parsed JSON body without reading the stream", async () => {
  let receivedImage;
  const handleRequest = createRequestHandler({
    analyzeProduct: async (image) => {
      receivedImage = image;
      return "These are red tomatoes.";
    },
    clientToken
  });
  const rawBody = Buffer.from(JSON.stringify(validBody));
  const request = {
    url: "/analyze-product",
    method: "POST",
    headers: {
      authorization: `Bearer ${clientToken}`,
      "content-type": "application/json",
      "content-length": String(rawBody.length)
    },
    body: validBody,
    rawBody
  };
  const result = {};
  const response = {
    writeHead(status, headers) {
      result.status = status;
      result.headers = headers;
    },
    end(body) {
      result.body = JSON.parse(body);
    }
  };

  await handleRequest(request, response);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { message: "These are red tomatoes." });
  assert.deepEqual(receivedImage, validBody);
});

test("enforces the size limit on Firebase's raw body", async () => {
  let calls = 0;
  const handleRequest = createRequestHandler({
    analyzeProduct: async () => {
      calls += 1;
      return "unused";
    },
    clientToken,
    maxRequestBytes: 24
  });
  const result = {};
  await handleRequest({
    url: "/analyze-product",
    method: "POST",
    headers: {
      authorization: `Bearer ${clientToken}`,
      "content-type": "application/json"
    },
    rawBody: Buffer.from(JSON.stringify(validBody))
  }, {
    writeHead(status) {
      result.status = status;
    },
    end(body) {
      result.body = JSON.parse(body);
    }
  });

  assert.equal(result.status, 413);
  assert.deepEqual(result.body, { error: ERROR_MESSAGES.imageTooLarge });
  assert.equal(calls, 0);
});

test("requires a client token when the server is created", () => {
  assert.throws(
    () => createHttpServer({ analyzeProduct: async () => "unused", clientToken: "" }),
    /AI_SHOP_CLIENT_TOKEN is required/
  );
});

test("rejects missing and incorrect bearer tokens before analysis", async (t) => {
  let calls = 0;
  const url = await startServer(t, {
    analyzeProduct: async () => {
      calls += 1;
      return "unused";
    }
  });

  const unauthorizedHeaders = [
    null,
    "Bearer wrong-token",
    "Bearer xxxxxxxxxxxxxxxxx",
    `bearer ${clientToken}`
  ];
  for (const authorization of unauthorizedHeaders) {
    const response = await postJson(url, validBody, authorization);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: ERROR_MESSAGES.unauthorized });
    assert.equal(response.headers.get("www-authenticate"), "Bearer");
  }
  assert.equal(calls, 0);
});

test("rejects unreadable JSON and invalid images before analysis", async (t) => {
  let calls = 0;
  const url = await startServer(t, {
    analyzeProduct: async () => {
      calls += 1;
      return "unused";
    }
  });

  const invalidJson = await postJson(url, "{");
  assert.equal(invalidJson.status, 400);
  assert.deepEqual(await invalidJson.json(), { error: ERROR_MESSAGES.invalidRequest });

  const invalidImage = await postJson(url, { imageBase64: "AAAA", mediaType: "image/jpeg" });
  assert.equal(invalidImage.status, 400);
  assert.deepEqual(await invalidImage.json(), { error: ERROR_MESSAGES.invalidImage });
  assert.equal(calls, 0);
});

test("rejects oversized request bodies", async (t) => {
  const url = await startServer(t, {
    analyzeProduct: async () => "unused",
    maxRequestBytes: 24
  });
  const response = await postJson(url, validBody);

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: ERROR_MESSAGES.imageTooLarge });
});

test("returns the stable failure contract for provider errors", async (t) => {
  const url = await startServer(t, {
    analyzeProduct: async () => {
      throw new ProviderError("response");
    }
  });
  const response = await postJson(url, validBody);

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: ERROR_MESSAGES.analysisFailed });
});
