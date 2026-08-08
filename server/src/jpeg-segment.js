export const SOI = 0xd8;
export const EOI = 0xd9;
export const SOS = 0xda;

export function isStartOfFrame(marker) {
  return marker >= 0xc0 && marker <= 0xcf &&
    marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

export function readSegment(bytes, offset) {
  if (offset + 2 > bytes.length) return null;
  const length = bytes.readUInt16BE(offset);
  if (length < 2 || offset + length > bytes.length) return null;
  return { end: offset + length, length };
}

export function validFrame(bytes, offset, length) {
  if (length < 11) return false;
  const height = bytes.readUInt16BE(offset + 3);
  const width = bytes.readUInt16BE(offset + 5);
  const components = bytes[offset + 7];
  return height > 0 && width > 0 &&
    components >= 1 && components <= 4 &&
    length === 8 + 3 * components;
}

export function validScanHeader(bytes, offset, length) {
  if (length < 8) return false;
  const components = bytes[offset + 2];
  return components >= 1 && components <= 4 &&
    length === 6 + 2 * components;
}
