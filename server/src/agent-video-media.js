import { execFile } from "node:child_process";
import { open, stat } from "node:fs/promises";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const execute = promisify(execFile);
export const VIDEO_MEDIA_TYPES = Object.freeze(["video/mp4", "video/quicktime"]);
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 120_000;
export const MAX_VIDEO_AXIS = 4_096;
export const MAX_VIDEO_FRAMES = 12;
export const VIDEO_FRAME_INTERVAL_MS = 1_000;

export class AgentVideoError extends Error {
  constructor(code, cause) {
    super(`Agent video rejected: ${code}.`, { cause });
    this.name = "AgentVideoError";
    this.code = code;
  }
}

export function isIsoBaseMedia(bytes) {
  return Buffer.isBuffer(bytes) && bytes.length >= 12
    && bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

export function sampledTimestamps(durationMs, {
  intervalMs = VIDEO_FRAME_INTERVAL_MS, maxFrames = MAX_VIDEO_FRAMES
} = {}) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new AgentVideoError("video_invalid");
  const count = Math.min(maxFrames, Math.max(1, Math.ceil(durationMs / intervalMs)));
  if (count === 1) return Object.freeze([Math.floor(durationMs / 2)]);
  const last = Math.max(0, durationMs - Math.min(intervalMs, durationMs));
  return Object.freeze(Array.from({ length: count }, (_, index) =>
    Math.round(last * index / (count - 1))));
}

function durationMs(stderr) {
  const match = /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderr);
  if (!match) return null;
  return Math.round((Number(match[1]) * 3600 + Number(match[2]) * 60
    + Number(match[3])) * 1000);
}

function dimensions(stderr) {
  const video = stderr.split("\n").find(line => line.includes("Video:"));
  const match = video && /(?:^|[, ])(\d{2,5})x(\d{2,5})(?:[, ]|$)/.exec(video);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

export async function inspectAgentVideo(path, { mediaType, expectedBytes,
  executeFile = execute } = {}) {
  if (!VIDEO_MEDIA_TYPES.includes(mediaType)) throw new AgentVideoError("media_type_unsupported");
  const held = await stat(path).catch(error => { throw new AgentVideoError("video_invalid", error); });
  if (held.size < 12 || held.size > MAX_VIDEO_BYTES
    || (Number.isInteger(expectedBytes) && held.size !== expectedBytes)) {
    throw new AgentVideoError(held.size > MAX_VIDEO_BYTES ? "file_too_large" : "video_invalid");
  }
  const prefix = Buffer.alloc(32);
  let handle;
  let bytesRead = 0;
  try {
    handle = await open(path, "r");
    ({ bytesRead } = await handle.read(prefix, 0, prefix.length, 0));
  } catch (error) { throw new AgentVideoError("video_invalid", error); }
  finally { await handle?.close().catch(() => {}); }
  if (bytesRead < 12) throw new AgentVideoError("video_invalid");
  if (!isIsoBaseMedia(prefix)) throw new AgentVideoError("video_invalid");
  let stderr;
  try {
    ({ stderr } = await executeFile(ffmpegPath, ["-hide_banner", "-i", path,
      "-map", "0:v:0", "-frames:v", "1", "-f", "null", "-"],
    { maxBuffer: 2 * 1024 * 1024 }));
  } catch (error) { throw new AgentVideoError("video_invalid", error); }
  const duration = durationMs(stderr);
  const size = dimensions(stderr);
  if (!duration || duration > MAX_VIDEO_DURATION_MS || !size
    || size.width > MAX_VIDEO_AXIS || size.height > MAX_VIDEO_AXIS
    || !/Video:\s*h264\b/.test(stderr)) {
    throw new AgentVideoError(duration > MAX_VIDEO_DURATION_MS
      ? "video_too_long" : "video_unsupported");
  }
  return Object.freeze({ byteLength: held.size, durationMs: duration,
    width: size.width, height: size.height, codec: "h264" });
}

export async function extractAgentVideoFrames(path, outputDirectory, {
  durationMs, executeFile = execute, timestamps = sampledTimestamps(durationMs)
} = {}) {
  const frames = [];
  for (const [index, timestampMs] of timestamps.entries()) {
    const framePath = `${outputDirectory}/frame-${String(index).padStart(3, "0")}.jpg`;
    try {
      await executeFile(ffmpegPath, ["-hide_banner", "-loglevel", "error",
        "-ss", (timestampMs / 1000).toFixed(3), "-i", path, "-frames:v", "1", "-an",
        "-vf", "scale=min(1600\\,iw):-2", "-q:v", "3", "-y", framePath],
      { maxBuffer: 2 * 1024 * 1024 });
    } catch (error) { throw new AgentVideoError("frame_extraction_failed", error); }
    frames.push(Object.freeze({ index, timestampMs, path: framePath }));
  }
  return Object.freeze(frames);
}
