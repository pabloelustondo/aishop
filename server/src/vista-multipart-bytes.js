function contiguousBodyRange(chunks, body) {
  if (chunks.length === 0 || chunks[0].buffer !== body.buffer) return null;
  for (let index = 1; index < chunks.length; index += 1) {
    const previous = chunks[index - 1];
    if (chunks[index].buffer !== body.buffer ||
        chunks[index].byteOffset !== previous.byteOffset + previous.length) return null;
  }
  const start = chunks[0].byteOffset - body.byteOffset;
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  return start >= 0 && start + length <= body.length ? { start, length } : null;
}

export function retainVistaPartBytes(chunks, body) {
  const range = contiguousBodyRange(chunks, body);
  return range ? body.subarray(range.start, range.start + range.length)
    : Buffer.concat(chunks);
}
