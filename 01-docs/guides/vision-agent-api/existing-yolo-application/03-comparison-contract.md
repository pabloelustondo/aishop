# Comparing like with like

Pablo's confirmed requirement is to evaluate products in the target catalog.
The following comparison rules are proposed for review, not implemented behavior.

## Define the comparison case before scoring

Use a visit/store, a specific evidence item, a capture stage (before or after),
and a versioned catalog snapshot. Both systems must receive the same visual evidence.
Never compare YOLO-before with AI-Shop-after: the shelf and view may have changed.
If photo, video frames or preprocessing differ, record separate experimental conditions.
Confirm which catalog subset is applicable to the client/store/category and visit date.

## Preserve three separate outputs

1. Raw YOLO prediction with model/class identifiers and evidence references.
2. Raw AI Shop prediction with model, prompt, settings and evidence references.
3. Human-reviewed reference, including unresolved identity or visibility questions.

Inspector-edited results should be retained separately from raw YOLO predictions.
An inspector's correction is useful evidence, not automatically infallible ground truth.
Weekly sellout and prior-day inventory are business context, not visual count targets.

## Apply a catalog-scoped comparison layer

Map predictions to exact catalog identifiers using brand, variant, size and packaging.
Brand-only matches are insufficient. Return candidate/ambiguous/unmatched mappings
instead of forcing a product into the nearest catalog row.
Separate exact in-catalog matches, ambiguous matches, out-of-catalog detections,
and unknown detections. Preserve all raw results for diagnosis.
Do not reward detection of non-catalog products as additional catalog coverage.
Do not hide wrong in-catalog assignments: they remain identification errors.
No prediction is not automatically confirmed absence; distinguish zero, unknown,
not evaluated and not visible. Missing expected products require reviewed evidence.

## Counts and metrics

Agree whether counts mean visible facings, physical units, boxes or multi-packs.
Do not infer hidden stock; do not count repeated video views as new products.
Compare catalog SKU presence and counts with the human-reviewed same-stage reference.
Report identification errors, missed catalog items and count errors separately.
Without a reviewed reference, report agreement/disagreement, not accuracy.

## Two experiments, not one invisible prompt change

First, map existing unrestricted AI Shop results to the catalog for an initial baseline.
Later, test catalog-conditioned recognition using approved catalog data as input.
Version that prompt/model change and rerun the same cases as a separate experiment.
Providing catalog names/images may improve matching, but does not establish visibility.
Minimal catalog scope/mapping is needed now; full catalog-service integration can remain later.
