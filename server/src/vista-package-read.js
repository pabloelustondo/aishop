import { createHash } from "node:crypto";
import { sendJson } from "./http-json.js";
import { classifyVistaVerifierFailure } from "./vista-auth-failure.js";
import { normalizeVistaRunId } from "./vista-package-identity.js";
import { VistaPackageError, vistaError, vistaErrorBody } from "./vista-package-error.js";

const SHA256 = /^[0-9a-f]{64}$/;
const BASE = "/v1/vista/inspection-packages";

function safeError(error) {
  return error instanceof VistaPackageError
    ? error : vistaError("unexpected_server_error", error);
}

/** `vista/inspection-packages/{ownerKey}/{runId}` — the write path's own layout. */
function prefixFor(ownerKey, runId) {
  return `vista/inspection-packages/${ownerKey}/${runId}`;
}

function summarize(document) {
  const data = document.data();
  return {
    runId: data.runId,
    ownerKey: data.ownerKey,
    receiptId: data.receiptId ?? null,
    // The record's own field is `status`; reading `state` silently yielded
    // "unknown" for every package.
    status: data.status ?? null,
    receivedAt: data.receivedAt ?? null,
    analysisStatus: data.analysisStatus ?? null,
    analysis: data.analysis ?? null,
    manifestSha256: data.manifestSha256 ?? null,
    terminalChainHash: data.terminalChainHash ?? null,
    artifacts: (data.artifactDescriptors ?? []).map((artifact) => ({
      id: artifact.id,
      kind: artifact.kind,
      mediaType: artifact.mediaType,
      sha256: artifact.sha256,
      byteCount: artifact.byteCount,
      captureId: artifact.captureId ?? null
    }))
  };
}

/**
 * Read-only access to already received packages.
 *
 * A caller sees only their own owner key. A configured reviewer sees every
 * owner — necessary today because the app uploads under an anonymous uid,
 * which nobody can map back to a person, so the uploader and the reviewer are
 * never the same identity.
 */
export function createVistaPackageReader({
  firestore, bucket, verifyIdToken, reviewers = [], logger = console,
  // Recognition is optional: without an analyzer the read paths all still
  // work and only the analyse route refuses.
  analyzeProduct = null, analysisModel = null
}) {
  /**
   * The read side needs the caller's email for the reviewer check, which the
   * write side deliberately does not expose — `authenticateVistaOwner` returns
   * an owner key and nothing else, and a test locks that shape. So the read
   * path derives its own identity here rather than widening that boundary.
   *
   * Ownership is still the hash of the verified uid, exactly as on write. The
   * email decides only whether a caller may look beyond their own packages.
   */
  async function caller(request) {
    const authorization = request.headers.authorization;
    const token = typeof authorization === "string"
      ? /^Bearer ([^\s]+)$/.exec(authorization)?.[1] : null;
    if (!token) throw vistaError("unauthorized");

    let identity;
    try {
      identity = await verifyIdToken(token);
    } catch (error) {
      throw classifyVistaVerifierFailure(error);
    }
    if (typeof identity?.uid !== "string" || identity.uid.length === 0) {
      throw vistaError("unauthorized");
    }
    const email = typeof identity.email === "string"
      ? identity.email.toLowerCase() : null;
    return Object.freeze({
      ownerKey: createHash("sha256").update(identity.uid, "utf8").digest("hex"),
      // A reviewer must be a verified email; an unverified one proves nothing.
      isReviewer: Boolean(email) && identity.email_verified === true
        && reviewers.includes(email)
    });
  }

  async function list({ ownerKey, isReviewer }) {
    const query = isReviewer
      ? firestore.collectionGroup("runs")
      : firestore.collection("vistaInspectionPackageOwners")
        .doc(ownerKey).collection("runs");
    const snapshot = await query.limit(200).get();
    return snapshot.docs.map(summarize);
  }

  /**
   * Serves one artifact. The hash must be declared by that run's own record,
   * so a caller can never name an arbitrary object path — only evidence the
   * server already recorded as part of the package.
   */
  async function resolveArtifact({ ownerKey, isReviewer }, runId, sha256, owner) {
    if (!normalizeVistaRunId(runId) || !SHA256.test(sha256)) {
      throw vistaError("artifact_identity_invalid");
    }
    // A reviewer may name the owner, because the listing gave it to them and
    // they are permitted to read beyond their own packages. Everyone else is
    // pinned to their own key, so naming another owner achieves nothing.
    //
    // Resolving by direct document path rather than a collection-group query:
    // Firestore does not auto-index fields for collection groups, so a
    // `where("runId", ...)` needs an explicit composite index and fails closed
    // with FAILED_PRECONDITION until one exists.
    const effectiveOwner = isReviewer && SHA256.test(String(owner ?? ""))
      ? owner : ownerKey;

    let record = await firestore.collection("vistaInspectionPackageOwners")
      .doc(effectiveOwner).collection("runs").doc(normalizeVistaRunId(runId)).get();

    // A reviewer that did not name an owner still gets an answer: scan the
    // group and match in memory. An unfiltered collection-group read needs no
    // index, unlike `where("runId", ...)`, which fails closed without one.
    if ((!record || !record.exists) && isReviewer) {
      const all = await firestore.collectionGroup("runs").limit(500).get();
      record = all.docs.find((doc) => doc.id === normalizeVistaRunId(runId)) ?? record;
    }
    if (!record || !record.exists) throw vistaError("artifact_missing");

    const data = record.data();
    const descriptor = (data.artifactDescriptors ?? [])
      .find((entry) => entry.sha256 === sha256);
    if (!descriptor) throw vistaError("artifact_missing");

    const path = `${prefixFor(data.ownerKey, data.runId)}/artifacts/${sha256}`;
    const [bytes] = await bucket.file(path).download();
    return { reference: record.ref, data, descriptor, bytes };
  }

  async function artifact(identity, runId, sha256, owner, response) {
    const { descriptor, bytes } = await resolveArtifact(identity, runId, sha256, owner);
    response.statusCode = 200;
    response.setHeader("Content-Type", descriptor.mediaType ?? "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    response.end(bytes);
  }

  /**
   * Recognition over one capture, on demand.
   *
   * One photograph per request on purpose. The function's ceiling is 30 s and
   * a shelf photograph costs several seconds, so a package-wide sweep would
   * sit against that limit and fail as a whole. Per photo it never approaches
   * it, and the reviewer watches findings land one at a time instead of
   * staring at a spinner.
   *
   * The result is additive: it never touches the device's own findings, and
   * `analysisStatus` records that the server was asked, not that the server
   * was right.
   */
  async function analyzePhoto(identity, runId, sha256, owner, response) {
    if (!analyzeProduct) throw vistaError("unexpected_server_error");
    const { reference, data, descriptor, bytes } =
      await resolveArtifact(identity, runId, sha256, owner);
    if (!String(descriptor.kind ?? "").startsWith("image/")) {
      throw vistaError("artifact_identity_invalid");
    }

    const report = await analyzeProduct({
      imageBase64: bytes.toString("base64"),
      mediaType: descriptor.mediaType ?? "image/jpeg",
      mode: "areaScan"
    });

    const finding = {
      report,
      model: analysisModel,
      mode: "areaScan",
      // Open world, deliberately: this increment asks what is actually on the
      // shelf, including products no catalog knows. Those answers are what a
      // catalog gets built from. Constraining to a catalog is the next step,
      // and until it exists a name here is an observation, not a match.
      catalogVersion: null,
      analyzedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    };

    await reference.update({
      [`analysis.photos.${sha256}`]: finding,
      analysisStatus: "analyzed"
    });

    logger.info("VISTA package photo analysed.", {
      runId: data.runId, sha256, model: analysisModel
    });
    sendJson(response, 200, { schemaVersion: 1, sha256, finding });
  }

  return async function handleVistaRead(request, response) {
    try {
      const url = new URL(request.url, "http://localhost");
      const identity = await caller(request);
      const rest = url.pathname.slice(BASE.length).replace(/^\//, "");

      if (rest === "") {
        sendJson(response, 200, {
          schemaVersion: 1,
          reviewer: identity.isReviewer,
          runs: await list(identity)
        });
        return;
      }
      const parts = rest.split("/");
      const owner = url.searchParams.get("owner");
      if (parts.length === 3 && parts[1] === "artifacts") {
        await artifact(identity, parts[0], parts[2], owner, response);
        return;
      }
      // Analysis writes, so it is POST — and only POST. A GET here would
      // otherwise spend an OpenAI call on a browser prefetch.
      if (parts.length === 4 && parts[1] === "artifacts" && parts[3] === "analysis") {
        if (request.method !== "POST") throw vistaError("artifact_identity_invalid");
        await analyzePhoto(identity, parts[0], parts[2], owner, response);
        return;
      }
      throw vistaError("artifact_identity_invalid");
    } catch (error) {
      const safe = safeError(error);
      // The cause is logged, not just the code: a bare
      // `unexpected_server_error` gives an operator nothing to act on. The
      // response body still carries only the stable code.
      logger.error("VISTA package read rejected.", {
        code: safe.code,
        status: safe.status,
        cause: error?.message ?? String(error)
      });
      sendJson(response, safe.status, vistaErrorBody(safe));
    }
  };
}
