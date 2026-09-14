import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AgentVideoError, extractAgentVideoFrames,
  inspectAgentVideo } from "./agent-video-media.js";

async function sha256File(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

export function createAgentVideoProcessor({ evidenceStore, analysisStore, runner,
  inspect = inspectAgentVideo, extract = extractAgentVideoFrames,
  diagnostics = () => {} } = {}) {
  if (typeof evidenceStore?.downloadSource !== "function"
    || typeof evidenceStore?.storeFrame !== "function"
    || typeof analysisStore?.readVideoUpload !== "function"
    || typeof runner?.run !== "function") {
    throw new TypeError("Video processing dependencies are required.");
  }
  return Object.freeze({
    async process({ ownerKey, analysisId }) {
      let upload = await analysisStore.readVideoUpload({ ownerKey, analysisId });
      if (["analyzing", "analyzed"].includes(upload.status)) {
        return Object.freeze({ processed: false, reason: "already-started" });
      }
      if (!["processing", "uploaded"].includes(upload.status)) {
        return Object.freeze({ processed: false, reason: "state" });
      }
      if (upload.status === "processing") {
        const directory = await mkdtemp(join(tmpdir(), "aishop-video-"));
        const source = join(directory, "source");
        try {
          await evidenceStore.downloadSource({ ownerKey, analysisId,
            destination: source });
          const metadata = await inspect(source, { mediaType: upload.mediaType,
            expectedBytes: upload.expectedByteLength });
          const extracted = await extract(source, directory, metadata);
          const frames = [];
          for (const frame of extracted) {
            frames.push(await evidenceStore.storeFrame({ ownerKey, analysisId,
              index: frame.index, timestampMs: frame.timestampMs,
              bytes: await readFile(frame.path) }));
          }
          await analysisStore.markVideoReady({ ownerKey, analysisId,
            sha256: await sha256File(source), ...metadata, frames });
          diagnostics("video.processed", { ownerKey, analysisId,
            frameCount: frames.length, durationMs: metadata.durationMs });
        } catch (error) {
          if (error instanceof AgentVideoError) {
            await analysisStore.markVideoFailed({ ownerKey, analysisId,
              reason: error.code }).catch(() => {});
          }
          diagnostics("video.failed", { ownerKey, analysisId,
            failureClass: error?.code ?? "video_processing_failed" });
          throw error;
        } finally { await rm(directory, { recursive: true, force: true }); }
        upload = await analysisStore.readVideoUpload({ ownerKey, analysisId });
      }
      if (upload.status === "uploaded") {
        await runner.run({ ownerKey, analysisId, context: null,
          diagnosticContext: { trigger: "video-processing" } });
        return Object.freeze({ processed: true, reason: "analysis-started" });
      }
      return Object.freeze({ processed: false, reason: upload.status });
    }
  });
}
