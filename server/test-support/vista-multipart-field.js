export function appendMultipartField(request, name, value = "untrusted") {
  const boundary = request.headers["content-type"].split("boundary=")[1];
  const closing = Buffer.from(`--${boundary}--\r\n`);
  const field = Buffer.from(`--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
  return { ...request, rawBody: Buffer.concat([
    request.rawBody.subarray(0, -closing.length), field, closing
  ]) };
}
