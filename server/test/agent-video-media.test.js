import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  extractAgentVideoFrames, inspectAgentVideo, isIsoBaseMedia,
  MAX_VIDEO_FRAMES, sampledTimestamps
} from "../src/agent-video-media.js";

const fixture = name => new URL(`fixtures/video/${name}`, import.meta.url);

test("recognizes ISO base media bytes rather than trusting an extension", async () => {
  assert.equal(isIsoBaseMedia((await readFile(fixture("three-frame.mov"))).subarray(0, 12)), true);
  assert.equal(isIsoBaseMedia(Buffer.from("not a movie")), false);
});

test("samples deterministically and never exceeds the configured frame budget", () => {
  assert.deepEqual(sampledTimestamps(3_000), [0, 1_000, 2_000]);
  assert.equal(sampledTimestamps(120_000).length, MAX_VIDEO_FRAMES);
  assert.deepEqual(sampledTimestamps(1_000), [500]);
});

for (const [name, mediaType] of [["three-frame.mov", "video/quicktime"],
  ["three-frame.mp4", "video/mp4"]]) {
  test(`inspects and extracts the ${name} fixture with the pinned executable`, async () => {
    const source = fixture(name);
    const bytes = await readFile(source);
    const metadata = await inspectAgentVideo(source, { mediaType, expectedBytes: bytes.length });
    assert.deepEqual(metadata, { byteLength: bytes.length, durationMs: 3_000,
      width: 160, height: 120, codec: "h264" });
    const directory = await mkdtemp(join(tmpdir(), "aishop-video-test-"));
    const frames = await extractAgentVideoFrames(source, directory, metadata);
    assert.equal(frames.length, 3);
    for (const frame of frames) assert.ok((await readFile(frame.path)).length > 100);
  });
}
