# Sprint 001 — Technical Plan

**Status:** Human validated — not authorized for implementation

## Technical objective

Deliver one working vertical path on Pablo's physical iPhone 17: capture a JPEG image, send it to the AI Shop API, analyze it with OpenAI, and display the returned message.

## iPhone client

- Build a minimal native iOS app using SwiftUI.
- Use AVFoundation for camera permission, live preview, and still-image capture.
- Compress the captured image to a practical JPEG size before upload.
- Send one HTTPS request and show idle, analyzing, result, and failure states.
- Keep the OpenAI credential and provider-specific request logic out of the app.

## AI Shop server

- Provide one HTTPS endpoint: `POST /analyze-product`.
- Accept one JPEG image and reject missing, invalid, or oversized input.
- Add a fixed Sprint 001 product-analysis instruction.
- Send the instruction and image to an image-capable model through the OpenAI API.
- Return a small JSON response and discard the image after the request.
- Read the OpenAI API key from the server environment only.

## Minimal contract

- Success: `{"message":"These appear to be fresh red tomatoes."}`
- Failure: `{"error":"The product could not be analyzed. Please try again."}`

## Delivery sequence

1. Create the iOS shell and reproduce the approved camera layout.
2. Capture and preview a still image on the physical iPhone.
3. Create the server endpoint with a temporary fixed response.
4. Connect the iPhone request and display the fixed response.
5. Replace the fixed response with the server-side OpenAI image call.
6. Add retry, invalid-image, network, and provider-failure handling.
7. Run the complete flow on the physical iPhone and retain evidence.

## Technical completion

The sprint is technically complete only when the installed iPhone app captures a new image, the server returns a real OpenAI analysis, the result appears in the approved upper interface, failures are understandable, and no API key or captured image is retained in the client or repository.
