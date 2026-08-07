const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;

function isStartOfFrame(marker) {
  return marker >= 0xc0 && marker <= 0xcf &&
    marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function readSegment(bytes, offset) {
  if (offset + 2 > bytes.length) return null;
  const length = bytes.readUInt16BE(offset);
  if (length < 2 || offset + length > bytes.length) return null;
  return { end: offset + length, length };
}

function validFrame(bytes, offset, length) {
  if (length < 11) return false;
  const height = bytes.readUInt16BE(offset + 3);
  const width = bytes.readUInt16BE(offset + 5);
  const components = bytes[offset + 7];
  return height > 0 && width > 0 &&
    components >= 1 && components <= 4 &&
    length === 8 + 3 * components;
}

function validScanHeader(bytes, offset, length) {
  if (length < 8) return false;
  const components = bytes[offset + 2];
  return components >= 1 && components <= 4 &&
    length === 6 + 2 * components;
}

function findNextMarker(bytes, start) {
  let entropyBytes = 0;
  let offset = start;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      entropyBytes += 1;
      offset += 1;
      continue;
    }

    const markerOffset = offset;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;

    const marker = bytes[offset];
    if (marker === 0x00) {
      entropyBytes += 1;
      offset += 1;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 1;
      continue;
    }
    return { markerOffset, hasEntropy: entropyBytes > 0 };
  }
  return null;
}

export function isStructurallyValidJpeg(bytes) {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== SOI) return false;

  let offset = 2;
  let sawFrame = false;
  let sawScan = false;
  let sawEntropy = false;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return false;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return false;

    const marker = bytes[offset++];
    if (marker === EOI) {
      return sawFrame && sawScan && sawEntropy && offset === bytes.length;
    }
    if (marker === SOI || marker === 0x00) return false;
    if (marker === 0x01) continue;
    if (marker >= 0xd0 && marker <= 0xd7) return false;

    const segment = readSegment(bytes, offset);
    if (!segment) return false;

    if (isStartOfFrame(marker)) {
      if (!validFrame(bytes, offset, segment.length)) return false;
      sawFrame = true;
    }

    if (marker === SOS) {
      if (!sawFrame || !validScanHeader(bytes, offset, segment.length)) return false;
      sawScan = true;
      const next = findNextMarker(bytes, segment.end);
      if (!next?.hasEntropy) return false;
      sawEntropy = true;
      offset = next.markerOffset;
      continue;
    }

    offset = segment.end;
  }
  return false;
}
