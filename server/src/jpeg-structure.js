import { findNextMarker } from "./jpeg-entropy.js";
import {
  EOI, isStartOfFrame, readSegment, SOI, SOS, validFrame, validScanHeader
} from "./jpeg-segment.js";

function readJpeg(bytes, start) {
  if (bytes.length - start < 12 || bytes[start] !== 0xff ||
      bytes[start + 1] !== SOI) return null;
  let offset = start + 2;
  let sawFrame = false, sawScan = false;
  let sawEntropy = false;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === EOI) return sawFrame && sawScan && sawEntropy ? offset : null;
    if (marker === SOI || marker === 0x00) return null;
    if (marker === 0x01) continue;
    if (marker >= 0xd0 && marker <= 0xd7) return null;
    const segment = readSegment(bytes, offset);
    if (!segment) return null;
    if (isStartOfFrame(marker)) {
      if (!validFrame(bytes, offset, segment.length)) return null;
      sawFrame = true;
    }
    if (marker === SOS) {
      if (!sawFrame || !validScanHeader(bytes, offset, segment.length)) return null;
      sawScan = true;
      const next = findNextMarker(bytes, segment.end);
      if (!next?.hasEntropy) return null;
      sawEntropy = true;
      offset = next.markerOffset;
      continue;
    }
    offset = segment.end;
  }
  return null;
}

export function isStructurallyValidJpeg(bytes) {
  let offset = 0;
  let images = 0;
  while (offset < bytes.length && images < 4) {
    offset = readJpeg(bytes, offset);
    if (offset === null) return false;
    images += 1;
  }
  return images > 0 && offset === bytes.length;
}
