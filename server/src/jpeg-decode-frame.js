import { validFrame, validScanHeader } from "./jpeg-segment.js";

export function readVistaJpegFrame(marker, bytes, offset, length, state) {
  if (![0xc0, 0xc1, 0xc2].includes(marker) || state.components ||
      !validFrame(bytes, offset, length) || bytes[offset + 2] !== 8) return false;
  const components = new Map();
  for (let index = 0; index < bytes[offset + 7]; index += 1) {
    const start = offset + 8 + index * 3;
    const id = bytes[start], sampling = bytes[start + 1], quantization = bytes[start + 2];
    if (components.has(id) || sampling >> 4 === 0 || (sampling & 15) === 0 ||
        sampling >> 4 > 4 || (sampling & 15) > 4 || quantization > 3) return false;
    components.set(id, quantization);
  }
  state.components = components;
  state.progressive = marker === 0xc2;
  state.dimensions = { height: bytes.readUInt16BE(offset + 3),
    width: bytes.readUInt16BE(offset + 5) };
  return true;
}

export function readVistaJpegScan(bytes, offset, length, state) {
  if (!state.components || !validScanHeader(bytes, offset, length)) return false;
  const count = bytes[offset + 2];
  for (let index = 0; index < count; index += 1) {
    const start = offset + 3 + index * 2;
    const tables = bytes[start + 1];
    if (!state.components.has(bytes[start]) ||
        !state.huffman[0].has(tables >> 4) || !state.huffman[1].has(tables & 15)) return false;
  }
  const spectralStart = bytes[offset + length - 3];
  const spectralEnd = bytes[offset + length - 2];
  const approximation = bytes[offset + length - 1];
  return state.progressive
    ? spectralStart <= spectralEnd && spectralEnd <= 63 && approximation <= 0xdd
    : spectralStart === 0 && spectralEnd === 63 && approximation === 0;
}

export function hasVistaJpegTables(state) {
  return state.components && [...state.components.values()]
    .every((identifier) => state.quantization.has(identifier));
}
