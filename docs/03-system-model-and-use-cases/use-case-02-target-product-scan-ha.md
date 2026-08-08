# Use Case 02 — Target a Specific Product

## Purpose

Help Pablo understand one deliberately selected product through a detailed report.

## Primary actor

Pablo, using AI Shop while shopping or examining a product.

## Context

This use case refines the single-product interaction in Use Case 01. Pablo chooses **Target Product** from a scan-mode page and enters a camera page that lets him aim precisely without losing the surrounding context.

## Main flow

1. Pablo selects **Target Product**.
2. AI Shop opens a camera page with a central crosshair and a short instruction.
3. Pablo places the crosshair intersection on the product he wants identified while keeping useful surrounding evidence, such as a price label, barcode, or packaging, visible in the full frame.
4. He captures the image.
5. AI Shop treats the product under the crosshair as the primary target and uses the rest of the image as supporting context.
6. AI Shop opens a dedicated, scrollable report containing:
   - the product and brand it identified;
   - visible quality, packaging, and price evidence;
   - uncertainty or information missing from the image; and
   - a recommendation only when the available evidence supports one.
7. Pablo reviews the report and makes his own decision.
8. He can analyze another product or return to the scan-mode page.

## Outcome

Pablo receives depth about one chosen product without fitting the result into the camera header or entering a chat conversation.

## Boundaries

If the crosshair does not indicate one clear primary product, AI Shop should explain the uncertainty and ask Pablo to retake the image. The report must not invent price, quality, or buying evidence that is not visible or otherwise known.
