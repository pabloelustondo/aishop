# Proof of Concept 01 — Camera to Shopping Recommendation

Validation, evidence, and boundaries are defined in [Proof of Concept 01 — Validation and Boundaries](proof-of-concept-01-validation-and-boundaries-ha.md).

## Question

Can a very small iPhone app help Pablo evaluate a product more quickly and directly than his current camera-and-ChatGPT workflow?

## Hypothesis

Pablo can point AI Shop at a product, take one picture, and receive a useful **Buy**, **Skip**, or **Uncertain** recommendation without uploading a photo, recreating context, or starting a conversation.

## End-to-end proof

Build a small native app that runs on Pablo's iPhone 17 and completes one interaction:

1. Pablo opens AI Shop and sees the live camera view.
2. He points the camera at a product and its visible price label.
3. He taps one capture button.
4. The app sends the image and predefined shopping context to a server endpoint.
5. The server sends both to an image-capable model through the OpenAI API.
6. The model returns a structured recommendation.
7. The app displays the recommendation on the same screen.

The proof uses the OpenAI API, not the consumer ChatGPT app. The API credential remains on the server and is never embedded in the iPhone app.

## Representative scenario

The first test is tomatoes in one nearby supermarket. The image should show the tomatoes and, when possible, their price label.

The predefined context contains only:

- Pablo's current need for tomatoes;
- the qualities he prefers in tomatoes;
- the supermarket being tested;
- known comparison prices from nearby supermarkets; and
- a short recommendation instruction.

This context can be a fixed test fixture. No database or context-editing interface is required.

## Result and interface

The glanceable result contains:

- one verdict: **Buy**, **Skip**, or **Uncertain**;
- one short reason;
- the important visible evidence, such as quality or price; and
- a warning when the image or context is insufficient.

The interface needs only a live camera view, capture button, analyzing state, result card, and retry button. It does not require a chat or any other screen.
