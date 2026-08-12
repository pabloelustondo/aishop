import { fixture } from "./vista-package-fixture.js";

export function impossibleHuffmanJpeg() {
  const bytes = Buffer.from(fixture.jpeg);
  const marker = bytes.indexOf(Buffer.from([0xff, 0xc4]));
  bytes.fill(0, marker + 5, marker + 21);
  bytes[marker + 5] = 12;
  return bytes;
}

export function insufficientEntropyJpeg() {
  const bytes = Buffer.from(fixture.jpeg);
  const frame = bytes.indexOf(Buffer.from([0xff, 0xc0]));
  bytes.writeUInt16BE(16, frame + 5);
  bytes.writeUInt16BE(16, frame + 7);
  const marker = bytes.indexOf(Buffer.from([0xff, 0xda]));
  const entropyStart = marker + 2 + bytes.readUInt16BE(marker + 2);
  return Buffer.concat([
    bytes.subarray(0, entropyStart), Buffer.from([0x00, 0xff, 0xd9])
  ]);
}
