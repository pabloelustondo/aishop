export function findNextMarker(bytes, start) {
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
