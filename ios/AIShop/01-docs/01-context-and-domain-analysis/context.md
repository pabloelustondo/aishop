# AIShop iPhone App: Context and Domain Analysis

## Context

AIShop has a basic iPhone client and server-side analysis capabilities. This
experiment adds a reusable client vision component that can be developed mostly
with prerecorded images and videos in Xcode and the iOS Simulator.

The phone should act as a real-time visual scanner, not merely record a video
for later batch processing. Immediate guidance helps the shopper slow down,
move closer, hold steady, or inspect a likely match.

## Domain realities

- Packaged products expose shape, color, logo, text, and sometimes barcodes.
- Exact identity cannot be inferred reliably from shape alone.
- Dense shelves make whole-frame similarity weak when the product is small.
- Produce is harder: the display or bin is often the useful recognition unit.
- Produce variety and price usually require a sign, PLU, barcode, or store data.
- Shelf labels must be associated spatially with products; appearance alone
  does not establish price.
- Video supplies coverage and temporal evidence; still images supply focused,
  high-resolution evidence for text, barcode, and difficult confirmations.

## Client/server boundary

The client owns responsive capture guidance, quality checks, frame selection,
candidate generation, tracking, deduplication, and evidence packaging where
device cost permits. The server owns expensive or ambiguous refinement,
catalog enrichment, cross-store knowledge, and authoritative persistence.
