export function responseResult() {
  const result = {};
  return { result, response: {
    writeHead(status, headers) {
      result.status = status;
      result.headers = headers;
    },
    end(body) {
      result.rawBody = body;
      result.body = JSON.parse(body);
    }
  } };
}
