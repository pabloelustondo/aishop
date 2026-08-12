# Environment Decisions Required Before Deployment

The HTTP/data contract is implementable and testable from this bundle. These
target-environment values cannot be truthfully chosen from the VISTA
repository. The receiving agent must record them before deployment.

## Required decisions

1. Exact server repository, authorized branch/commit, and local agent
   instructions.
2. Firebase development project ID, function generation/runtime, region,
   Storage bucket, Firestore database, and emulator/test configuration.
3. Deployment authority and the human reviewer for security or contract
   exceptions.
4. Data residency, EXIF/privacy handling, and retention policy for real field
   evidence. Endpoint v1 performs no deletion.
5. Actual platform and middleware request-size limits, including whether the
   framework buffers multipart bodies.
6. Runtime limits for manifest bytes, audit bytes, bytes per JPEG, JPEG pixel
   dimensions/megapixels, image count, part count, and complete package bytes.
7. Whether the first test uses only the synthetic fixture, emulators, or a
   named development project with a dedicated test account.

## Protocol ceiling versus runtime limits

Manifest schema v1 has a protocol ceiling of 100 logical artifact descriptors.
That is not a claim that the deployment can receive 100 images in one request.
The configured runtime count and byte limits may be lower, but they must allow
the complete declared package or reject it with `413 package_too_large`.

Do not truncate an inspection, silently drop later images, or call a partial
set received. If measured real packages cannot fit below the platform limit,
stop. That evidence—not speculation—would justify changing transport to a
resumable upload while preserving the manifest and receipt semantics.

The imported AI-Shop guide uses a 5 MiB decoded-JPEG ceiling for its one-image
Base64 endpoint. It is a useful candidate per-image bound, not automatic
approval for VISTA's total-package limit.

## Configuration must fail closed

Limit and target configuration must be explicit in the development
environment and testable. A missing critical limit, project, bucket, or
database setting must prevent startup/deployment rather than choose production
or an unlimited value silently.

