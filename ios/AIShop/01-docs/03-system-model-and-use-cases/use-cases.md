# AIShop iPhone App: System Model and Use Cases

## Primary actors

- Shopper: scans, follows guidance, confirms or rejects suggestions.
- iPhone vision client: converts media into local evidence and candidate results.
- Catalog: supplies product identities, reference media, and metadata.
- AIShop server: refines uncertain evidence and persists shared knowledge.

## Use cases

1. **Find a shopping-list product.** Search a shelf for a named target, signal a
   likely sighting, guide closer inspection, and later verify price.
2. **Solve a problem.** Start with a need such as gluing or painting, infer a
   product category, scan the relevant section, and compare candidates.
3. **Find opportunities.** Notice unusually good price, quality, or availability
   and compare observations across nearby stores.
4. **Choose a substitute.** Recommend an acceptable alternative when a target is
   absent, unsuitable, or too expensive.
5. **Build personal product memory.** Record want-to-try, favorite, regular,
   buy-on-discount, acceptable-substitute, and avoid decisions.

## First vertical slice

Use case 1 begins with one exact, known packaged product. The component receives
one reference image and a prerecorded video, then emits `possible match` evidence
during streaming playback. General recognition, price, produce, and substitution
remain later increments.
