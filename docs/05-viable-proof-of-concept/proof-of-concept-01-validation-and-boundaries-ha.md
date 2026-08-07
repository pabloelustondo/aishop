# Proof of Concept 01 — Validation and Boundaries

## Success criteria

The proof succeeds when:

1. It runs on Pablo's physical iPhone 17 and captures a new product image.
2. The image and predefined context reach the server and OpenAI API.
3. The app displays a valid **Buy**, **Skip**, or **Uncertain** result.
4. Pablo understands the result at a glance without entering context or chatting.
5. From an aimed camera, one deliberate action requests the recommendation.
6. A side-by-side trial requires fewer steps and reaches a decision faster than the benchmark ChatGPT workflow.
7. Poor or incomplete evidence produces **Uncertain**, not an invented confident recommendation.

Record capture-to-result time during physical-device trials. Set a strict threshold only after observing realistic camera, network, and model latency.

## Evidence to retain

- product, store, image, and predefined context;
- the model result displayed by the app;
- capture-to-result time and deliberate user actions;
- whether Pablo found the recommendation understandable and useful; and
- equivalent time and actions using the benchmark ChatGPT workflow.

## Safety and privacy boundaries

- The recommendation is advice; Pablo makes the buying decision.
- The app communicates uncertainty when visual or price evidence is insufficient.
- The OpenAI API key exists only in the server environment.
- Aim the camera at products and labels, not people; do not retain images unless a later proof defines that need and its privacy rules.

## Explicit exclusions

This proof does not include:

- a dynamic grocery list or full product catalog;
- automatic price history, store identification, or product identification;
- user accounts, multiple users, conversation, or offline operation; or
- polished production design, App Store distribution, or a production-ready backend.

## Decision after the proof

Proceed only if the physical-device trial is reliable, produces useful recommendations from limited context, and improves on the manual benchmark.

If it fails, use the evidence to identify whether the constraint is image capture, visible information, context, model analysis, network latency, or result presentation before expanding scope.

## Technical references

[OpenAI images and vision](https://developers.openai.com/api/docs/guides/images-vision) · [OpenAI authentication](https://developers.openai.com/api/reference/overview#authentication)
