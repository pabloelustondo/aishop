# Sprint 002 — Target Product and Area Scan Reports

HumanReviewerInitials:PME
**Status:** Implemented in Sprint 002; follow-up defect moves to Sprint 003

## Goal

Turn the successful camera proof of concept into two focused experiences: depth about one targeted product and breadth across the products visible in an area, each with its own clear, scrollable report.
## Main flows

### Target Product

1. Pablo chooses **Target Product** from the scan-mode page.
2. He places a central crosshair on one product while keeping useful surrounding evidence visible in the full frame.
3. AI Shop treats the product under the crosshair as primary, uses the surrounding context, and opens a detailed report.
4. Pablo reviews the evidence, uncertainty, and supported conclusion, then scans again or returns to the modes.

### Area Scan

1. Pablo chooses **Area Scan** from the scan-mode page.
2. He frames a shelf, display, bin, or small shopping area and captures it.
3. AI Shop identifies distinct visible products and opens a bounded list report.
4. Pablo reviews the identified and uncertain items, then scans another area or uses Target Product for depth.

## In scope

- A scan-mode page with **Target Product** and **Area Scan** choices.
- Separate camera pages with a central crosshair for Target Product or broad edge guides for Area Scan.
- Structured responses that automatically open the matching report after analysis.
- A detailed Target Product report with identity, visible evidence, missing information, and a supported conclusion.
- A bounded Area Scan report with identified count, concise product entries, and uncertain items.
- Scrollable content, clear back paths, scan-again actions, and understandable failure states.
- Physical-iPhone delivery and validation.

## Out of scope

- Automatic product cropping or opening Target Product directly from an Area report.
- Continuous video recognition or inventory-level accuracy.
- Product catalogs, grocery lists, price history, or supermarket comparisons.
- A Buy or Skip conclusion when the available evidence does not support one.
- Image retention, report history, user accounts, or App Store distribution.

## Acceptance and evidence

- Pablo can choose either mode and return to the scan-mode page.
- Target Product selects the product under the crosshair, uses surrounding evidence, and displays its detailed report.
- Area Scan identifies multiple visible products and displays an organized list report.
- Long report content remains readable through scrolling and is never truncated in the camera header.
- Both reports communicate uncertainty and never invent unsupported evidence or conclusions.
- Automated tests and physical-iPhone evidence demonstrate both complete camera-to-report flows.
