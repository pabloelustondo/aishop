# Image Capture and Preparation

HumanReviewerInitials: PME

## Implemented capture path

1. `AVCaptureSession` uses the back wide-angle camera with `.photo` preset.
2. `AVCapturePhotoSettings` requests `AVVideoCodecType.jpeg`.
3. `AVCapturePhoto.fileDataRepresentation()` returns the captured JPEG as `Data`.
4. `CameraScreen` passes those exact bytes to `AnalysisViewModel` and then `InspectionAPIClient`.
5. The client Base64-encodes the bytes with `Data.base64EncodedString()`.

AI Shop does not currently extract EXIF, OCR text, dimensions, prices, barcodes, or product names on-device. The server/model obtains visual information from the JPEG. The client supplies only audit/context metadata.

## Request metadata

| Field | Source |
| --- | --- |
| `imageBase64` | Exact captured JPEG bytes encoded as canonical Base64 |
| `mediaType` | Literal `image/jpeg` |
| `mode` | `targetProduct` or `areaScan` selected by the user |
| `appVersion` | `CFBundleShortVersionString (CFBundleVersion)` |
| `targetPosition` | `{ "x": 0.5, "y": 0.5 }` for target mode; `null` for area mode |

Coordinates are normalized from 0 through 1, left-to-right and top-to-bottom. The target reticle is centered, so AI Shop uses `(0.5, 0.5)`.

## Requirements for another app

- Confirm the bytes are genuinely JPEG; do not label HEIC, PNG, or WebP as `image/jpeg`.
- If the camera/library returns another format, decode it and create JPEG data before Base64 encoding.
- Keep the decoded JPEG at or below 5 MiB; Base64 adds approximately 33 percent.
- AI Shop contains an optional `ImageProcessor.uploadJPEG` helper that scales the longest side to 1,600 pixels and encodes at quality `0.72`, but the current camera flow does not call it.
- Decide explicitly whether the second app preserves original capture bytes or uploads a normalized derivative; the server preserves exactly what it receives as `original.jpg`.
- Avoid a `data:image/jpeg;base64,` prefix in `imageBase64`; send only the Base64 characters.
