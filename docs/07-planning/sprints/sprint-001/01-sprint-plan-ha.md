# Sprint 001 — Camera to AI Message

**Status:** Human validated — not authorized for implementation

## Goal

Prove the smallest useful AI Shop experience on Pablo's physical iPhone 17: take a product picture in the app, send it for OpenAI image analysis, and display a short result in the camera interface.

## User experience

1. Pablo opens AI Shop and sees the live camera view.
2. He points the camera at a product and taps the capture button.
3. The app shows an analyzing state.
4. A small server sends the image to an image-capable model through the OpenAI API.
5. The app displays the returned product message in the upper camera border.
6. Pablo can clear the result and take another picture.

## In scope

- A minimal native iPhone app resembling the approved camera mockup.
- Camera permission, live preview, and still-image capture.
- A small server endpoint that keeps the OpenAI API key off the phone.
- One image-analysis request and one short textual response.
- Analyzing, result, retry, and understandable failure states.
- Installation and demonstration on Pablo's physical iPhone 17.

## Out of scope

- Grocery lists, product catalogs, preferences, and price history.
- Store comparisons or a true **Buy** or **Skip** judgment.
- User accounts, multiple users, chat, or follow-up questions.
- Saving photographs or analysis history.
- Offline operation, App Store distribution, and production infrastructure.
- Production visual polish beyond the approved interaction concept.

## Acceptance criteria

1. The app launches on Pablo's physical iPhone 17 and shows the live camera.
2. Pablo can capture a new image without leaving AI Shop.
3. The image reaches the server and OpenAI API without exposing the API key in the app.
4. The app displays a relevant product-analysis message in the upper interface.
5. Pablo can understand the result without entering text or opening a chat.
6. Pablo can retry after either a successful result or a clear failure message.

## Evidence and gate

Retain the tested build identity, a physical-device screen recording or screenshots, the displayed result, relevant server logs without secrets, and capture-to-result time.

Implementation requires separate explicit authorization after this plan is reviewed and human validated.
