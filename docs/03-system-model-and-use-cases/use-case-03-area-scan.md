# Use Case 03 — Scan an Area

HumanReviewerInitials:PME

## Purpose

Help Pablo discover the different products visible across a shelf, display, bin, or other small shopping area.

## Primary actor

Pablo, exploring what products are available around him.

## Context

Pablo chooses **Area Scan** from a scan-mode page and enters a camera page designed for a broad view rather than one central product.

## Main flow

1. Pablo selects **Area Scan**.
2. AI Shop opens a camera page with broad edge guides and a short instruction.
3. Pablo frames the area so the visible products and labels are as clear as possible.
4. He captures one image.
5. AI Shop identifies and separates the distinct visible products it can recognize.
6. AI Shop opens a dedicated, scrollable report containing:
   - the number of products identified;
   - a concise entry for each identified product;
   - visible price or packaging observations when readable; and
   - a separate indication of uncertain or obscured products.
7. Pablo reviews the area report.
8. If he wants more detail about one item, he returns to the scan modes and uses **Target Product**.

## Outcome

Pablo can understand a product area faster and more systematically than identifying and organizing every item by eye.

## Boundaries

The first Area Scan report is a bounded list, not a detailed report for every item. It does not guarantee identification of hidden or unreadable products and does not yet include automatic cropping, continuous video recognition, inventory accuracy, or image retention.
