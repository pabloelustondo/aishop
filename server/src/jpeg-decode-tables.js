function readQuantization(bytes, offset, length, state) {
  let cursor = offset + 2;
  while (cursor < offset + length) {
    const information = bytes[cursor++];
    const precision = information >> 4;
    const identifier = information & 0x0f;
    if (precision > 1 || identifier > 3) return false;
    cursor += precision === 0 ? 64 : 128;
    if (cursor > offset + length) return false;
    state.quantization.add(identifier);
  }
  return cursor === offset + length;
}

function readHuffman(bytes, offset, length, state) {
  let cursor = offset + 2;
  while (cursor < offset + length) {
    const information = bytes[cursor++];
    const tableClass = information >> 4;
    const identifier = information & 0x0f;
    if (tableClass > 1 || identifier > 3 || cursor + 16 > offset + length) return false;
    let symbols = 0;
    for (let index = 0; index < 16; index += 1) symbols += bytes[cursor + index];
    cursor += 16 + symbols;
    if (symbols === 0 || cursor > offset + length) return false;
    state.huffman[tableClass].add(identifier);
  }
  return cursor === offset + length;
}

export function readVistaJpegTable(marker, bytes, offset, length, state) {
  if (marker === 0xdb) return readQuantization(bytes, offset, length, state);
  if (marker === 0xc4) return readHuffman(bytes, offset, length, state);
  return true;
}
