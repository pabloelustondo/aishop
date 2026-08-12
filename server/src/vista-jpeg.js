import { findNextMarker } from "./jpeg-entropy.js";
import {
  hasVistaJpegTables, readVistaJpegFrame, readVistaJpegScan
} from "./jpeg-decode-frame.js";
import { readVistaJpegTable } from "./jpeg-decode-tables.js";
import {
  EOI, isStartOfFrame, readSegment, SOI, SOS
} from "./jpeg-segment.js";

export function inspectVistaJpeg(bytes) {
  if (bytes.length < 12 || bytes[0] !== 0xff || bytes[1] !== SOI) return null;
  let offset = 2;
  const state = { components: null, dimensions: null, progressive: false,
    quantization: new Set(), huffman: [new Set(), new Set()] };
  let sawScan = false;
  let sawEntropy = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === EOI) {
      return hasVistaJpegTables(state) && sawScan && sawEntropy && offset === bytes.length
        ? Object.freeze(state.dimensions) : null;
    }
    if (marker === SOI || marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      return null;
    }
    if (marker === 0x01) continue;
    const segment = readSegment(bytes, offset);
    if (!segment) return null;
    if (isStartOfFrame(marker)) {
      if (!readVistaJpegFrame(marker, bytes, offset, segment.length, state)) return null;
    }
    if (!readVistaJpegTable(marker, bytes, offset, segment.length, state)) return null;
    if (marker === SOS) {
      if (!readVistaJpegScan(bytes, offset, segment.length, state)) return null;
      const next = findNextMarker(bytes, segment.end);
      if (!next?.hasEntropy) return null;
      sawScan = true;
      sawEntropy = true;
      offset = next.markerOffset;
    } else offset = segment.end;
  }
  return null;
}
