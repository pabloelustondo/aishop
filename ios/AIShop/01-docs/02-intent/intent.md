# AIShop iPhone App: Intent

## Product intent

Help a shopper understand what is visible, find wanted products, learn useful
alternatives, associate prices, and remember personal product preferences.

## Engineering intent

Build a source-independent, on-device streaming vision pipeline whose core can
be exercised deterministically with repository fixtures on a developer machine,
without a camera or a phone. The live camera is an adapter, not a prerequisite
for development.

## Experience principles

- Prefer immediate provisional feedback over delayed false certainty.
- Distinguish `possible match`, `probable match`, and confirmed evidence.
- Analyze selected frames, not every frame, and drop stale work.
- Preserve the best evidence and timestamp behind every user-visible result.
- Use video for discovery and targeted stills for uncertain confirmation.
- Keep product identity, observed price, and personal preference separate.
- Degrade safely when the camera, network, model, or server is unavailable.

## Initial intent

Prove the smallest useful loop: one catalog target plus one prerecorded video
produces a timely, explainable candidate signal without camera or network access.
