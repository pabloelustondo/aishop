# Existing YOLO application — evidence and comparison guide

This package documents the application Pablo calls the current YOLO application,
using five supplied screenshots and the original catalog workbook.
The visible interface is **KSK Retail+ Backoffice**, on its Auditoría page.
No access to that live application, source code or detection API was used.

## The business constraint

Pablo confirms that product recognition matters only for products in the application's
catalog. AI Shop's unrestricted product report is therefore not directly comparable.
A fair comparison needs the same evidence, catalog version, product identity and
count definition. Recognizing additional non-catalog brands is not automatically
a better result for this application.

## Read in order

1. [Observed workflow and screenshots](01-observed-application.md)
2. [Catalog contents and data quality](02-catalog.md)
3. [Catalog-scoped comparison approach](03-comparison-contract.md)
4. [Questions and next evidence to collect](04-open-questions.md)
5. [Source inventory and fingerprints](05-source-inventory.md)
6. [Numbered findings design example](06-numbered-findings-example.md)

## Evidence boundaries

Confirmed user context: this is the YOLO application and recognition is catalog-scoped.
Observed UI: audit filters, visits, product categories, comments, before/after photos,
weekly sellout and prior-day inventory. These observations do not prove how YOLO
generates detections or how inspectors correct them.
Unconfirmed: model version, raw detection counts, confidence scores, human changes,
catalog-to-model class mapping and exact timing of before/after captures.
The supplied screenshots are provisional; higher-quality original images will follow.
Do not use screenshots of browser pages as substitutes for original benchmark media.

## Preservation and scope

The assets folder contains unchanged copies of the five screenshots and workbook.
Screenshots include browser chrome and business context; review before external sharing.
The workbook has not been edited, normalized or imported into Firebase.
The comparison approach is a proposal, not an implemented API or prompt change.
The numbered sample is a generated design mockup, not an API or benchmark run.
No catalog integration or new benchmark runs were started.

Related: [roadmap](../../../07-planning/roadmap/README.md) and
[developer guide](../developer-guide.md).
