import { createHash } from "node:crypto";

/** The verified uid is hashed before it reaches a path; 64 lowercase hex. */
const OWNER_KEY = /^[0-9a-f]{64}$/;

/**
 * Server-generated identifiers only. Anchored and free of separators and
 * dots, so no caller-supplied value can walk out of its owner's prefix.
 */
const ANALYSIS_ID = /^[0-9A-Za-z_-]{1,64}$/;
const ATTEMPT_ID = /^[0-9A-Za-z_-]{1,64}$/;

const PREFIX = "agent/analyses";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A source object already exists at this identity. Never overwritten. */
export class AgentEvidenceAlreadyExistsError extends Error {
  constructor(path) {
    super("Agent source evidence already exists.");
    this.name = "AgentEvidenceAlreadyExistsError";
    this.code = "source_exists";
    this.path = path;
  }
}

/**
 * Storage could not serve the request. The provider's own message is
 * deliberately not carried into `message`: it reaches logs through `cause`
 * and never reaches a response body.
 */
export class AgentEvidenceUnavailableError extends Error {
  constructor(cause) {
    super("Agent evidence storage is unavailable.", { cause });
    this.name = "AgentEvidenceUnavailableError";
    this.code = "storage_unavailable";
  }
}

function objectPath(ownerKey, analysisId) {
  if (typeof ownerKey !== "string" || !OWNER_KEY.test(ownerKey)) {
    throw new TypeError("A lowercase hex owner key is required.");
  }
  if (typeof analysisId !== "string" || !ANALYSIS_ID.test(analysisId)) {
    throw new TypeError("A server-generated analysis identifier is required.");
  }
  return `${PREFIX}/${ownerKey}/${analysisId}/source`;
}

function framePath(ownerKey, analysisId, attemptId, index) {
  if (!Number.isInteger(index) || index < 0 || index > 999) {
    throw new TypeError("A bounded frame index is required.");
  }
  if (attemptId === null) {
    return `${objectPath(ownerKey, analysisId)}/frames/${String(index).padStart(3, "0")}.jpg`;
  }
  if (!ATTEMPT_ID.test(attemptId ?? "")) {
    throw new TypeError("A video attempt identifier is required.");
  }
  const root = objectPath(ownerKey, analysisId).replace(/\/source$/, "");
  return `${root}/attempts/${attemptId}/frames/${String(index).padStart(3, "0")}.jpg`;
}

function resumableSession(value) {
  let uri;
  try { uri = new URL(value); } catch { throw new TypeError("A resumable upload session is required."); }
  if (uri.protocol !== "https:" || uri.hostname !== "storage.googleapis.com"
    || !uri.pathname.startsWith("/upload/storage/")
    || !uri.searchParams.has("upload_id")) {
    throw new TypeError("A resumable upload session is required.");
  }
  return uri.toString();
}

/**
 * Immutable source evidence for one uploaded analysis.
 *
 * Deliberately independent of the VISTA evidence store. That one preserves a
 * device's sealed multi-artifact run and verifies an existing object against
 * its manifest before continuing. Here there is no manifest and identifiers
 * are server-generated, so an object that already exists is not a retry of a
 * known package — it is a collision that should never happen, and the honest
 * answer is to refuse rather than to reconcile.
 */
export function createAgentEvidenceStore({ bucket, fetchImpl = fetch,
  sessionTimeoutMs = 15_000 } = {}) {
  if (!bucket || typeof bucket.file !== "function") {
    throw new TypeError("A Cloud Storage bucket is required.");
  }
  if (typeof fetchImpl !== "function" || !Number.isInteger(sessionTimeoutMs)
    || sessionTimeoutMs < 1 || sessionTimeoutMs > 30_000) {
    throw new TypeError("A bounded Storage session client is required.");
  }

  return Object.freeze({
    async createVideoUploadSession({ ownerKey, analysisId, mediaType,
      byteLength, origin }) {
      const path = objectPath(ownerKey, analysisId);
      if (!Number.isInteger(byteLength) || byteLength <= 0) {
        throw new TypeError("The declared video byte length is required.");
      }
      try {
        const [uri] = await bucket.file(path).createResumableUpload({
          // Uniform bucket-level access rejects legacy per-object ACL options.
          origin, preconditionOpts: { ifGenerationMatch: 0 },
          metadata: { contentType: mediaType, contentLength: byteLength,
            cacheControl: "private, no-store", metadata: { ownerKey,
              analysisId, expectedByteLength: String(byteLength) } }
        });
        return Object.freeze({ path, uri });
      } catch (error) { throw new AgentEvidenceUnavailableError(error); }
    },

    async storeSource({ ownerKey, analysisId, bytes, mediaType }) {
      const path = objectPath(ownerKey, analysisId);
      if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
        throw new TypeError("Source bytes are required.");
      }
      if (typeof mediaType !== "string" || mediaType.length === 0) {
        throw new TypeError("A media type is required.");
      }

      const digest = sha256(bytes);
      try {
        await bucket.file(path).save(bytes, {
          resumable: false,
          preconditionOpts: { ifGenerationMatch: 0 },
          metadata: {
            contentType: mediaType,
            cacheControl: "private, no-store",
            metadata: { ownerKey, analysisId, sha256: digest,
              byteLength: String(bytes.length) }
          }
        });
      } catch (error) {
        if (error?.code === 412) throw new AgentEvidenceAlreadyExistsError(path);
        throw new AgentEvidenceUnavailableError(error);
      }
      return Object.freeze({ path, sha256: digest, byteLength: bytes.length });
    },

    async readSource({ ownerKey, analysisId }) {
      const path = objectPath(ownerKey, analysisId);
      let bytes;
      let metadata;
      try {
        const file = bucket.file(path);
        [[bytes], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
      } catch (error) {
        throw new AgentEvidenceUnavailableError(error);
      }
      // The digest describes the bytes actually returned, not the value
      // recorded at write time. A stored hash that disagrees with its own
      // object would otherwise be reported as if it were true.
      return Object.freeze({
        path, bytes, mediaType: metadata?.contentType ?? null, sha256: sha256(bytes)
      });
    },

    async describeSource({ ownerKey, analysisId }) {
      const path = objectPath(ownerKey, analysisId);
      try {
        const [metadata] = await bucket.file(path).getMetadata();
        return Object.freeze({ path, mediaType: metadata?.contentType ?? null,
          byteLength: Number(metadata?.size), generation: metadata?.generation ?? null });
      } catch (error) { throw new AgentEvidenceUnavailableError(error); }
    },

    async downloadSource({ ownerKey, analysisId, destination }) {
      const path = objectPath(ownerKey, analysisId);
      try {
        await bucket.file(path).download({ destination });
        return Object.freeze({ path, destination });
      } catch (error) { throw new AgentEvidenceUnavailableError(error); }
    },

    async storeFrame({ ownerKey, analysisId, attemptId = null, index,
      timestampMs, bytes }) {
      const path = framePath(ownerKey, analysisId, attemptId, index);
      if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
        throw new TypeError("Frame bytes are required.");
      }
      const digest = sha256(bytes);
      try {
        await bucket.file(path).save(bytes, {
          resumable: false, preconditionOpts: { ifGenerationMatch: 0 },
          metadata: { contentType: "image/jpeg", cacheControl: "private, no-store",
            metadata: { ownerKey, analysisId,
              ...(attemptId === null ? {} : { attemptId }), index: String(index),
              timestampMs: String(timestampMs), sha256: digest } }
        });
      } catch (error) {
        if (error?.code === 412) {
          try {
            const [metadata] = await bucket.file(path).getMetadata();
            if (metadata?.metadata?.sha256 === digest) {
              return Object.freeze({ index, timestampMs, path, sha256: digest,
                byteLength: bytes.length });
            }
          } catch {}
          throw new AgentEvidenceAlreadyExistsError(path);
        }
        throw new AgentEvidenceUnavailableError(error);
      }
      return Object.freeze({ index, timestampMs, path, sha256: digest,
        byteLength: bytes.length });
    },

    async readFrames({ ownerKey, analysisId, attemptId = null, frames }) {
      if (!Array.isArray(frames) || frames.length === 0) {
        throw new AgentEvidenceUnavailableError(new Error("Frame manifest is empty."));
      }
      try {
        return Object.freeze(await Promise.all(frames.map(async frame => {
          const path = framePath(ownerKey, analysisId, attemptId, frame.index);
          const [bytes] = await bucket.file(path).download();
          return Object.freeze({ index: frame.index, timestampMs: frame.timestampMs,
            bytes, mediaType: "image/jpeg", sha256: sha256(bytes) });
        })));
      } catch (error) {
        if (error instanceof AgentEvidenceUnavailableError) throw error;
        throw new AgentEvidenceUnavailableError(error);
      }
    },

    async invalidateVideoUploadSession({ uri: value }) {
      const uri = resumableSession(value);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), sessionTimeoutMs);
      timeout.unref?.();
      try {
        const response = await fetchImpl(uri, { method: "DELETE",
          signal: controller.signal });
        if (response.ok || [404, 410, 499].includes(response.status)) {
          return Object.freeze({ invalidated: true });
        }
        throw new AgentEvidenceUnavailableError(
          Object.assign(new Error("Session invalidation failed."),
            { status: response.status }));
      } catch (error) {
        if (error instanceof AgentEvidenceUnavailableError) throw error;
        throw new AgentEvidenceUnavailableError(error);
      } finally { clearTimeout(timeout); }
    },

    sourceStream({ ownerKey, analysisId }) {
      return bucket.file(objectPath(ownerKey, analysisId)).createReadStream();
    }
  });
}
