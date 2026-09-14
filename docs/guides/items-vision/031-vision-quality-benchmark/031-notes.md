# 031 - A Correct Answer Needs a Correct Reference

The repository contains valuable visual-analysis baselines.
It also records why those baselines cannot yet support a formal accuracy score.

## Human verification comes first
The current tabletop and dense-shelf references began as GPT outputs obtained by hand.
They were not approved as human ground truth.
A reviewer still needs to validate identities and quantities against the original images.
The benchmark must preserve that reviewed reference as a versioned artifact.

## Settle the counting contract
Front facings and visible physical units answer different business questions.
A facing counts a product front on the active display plane.
Visible-unit counting may also include packages stacked or positioned behind it.
The dense-shelf reference reports 94 visible units across 42 groups.
An independent reading estimated about 57 facings plus 21 units in stacks.
Neither total can score the other until the metric is fixed.

## Settle identification depth
A broad product family can be correct while its brand, variant, or size is wrong.
The benchmark should state whether it requires family, product, variant, size, or SKU.
Visual similarity cannot prove an exact SKU without readable labels, catalog data, or barcode evidence.

## Preserve uncertainty and provenance
Partial and cropped products should remain marked as partial.
Unreadable identity should become unknown rather than a confident invented name.
Count confidence and identification confidence should remain separate.
Each reported quantity should link to visible source objects or a declared no-localization reason.

## Current contract gaps
The dense reference contains 42 groups while the current response schema caps rows at 40.
This is a contract decision, not a model-quality finding.
The application, benchmark, and scoring tool must use compatible definitions.

## Transition
Once the reference and contract agree, controlled model comparisons become meaningful.
The next slide separates those quality experiments from system-reliability tests.

## Visual direction
Show the original evidence, human-verified reference, AI result, and comparison in sequence.
Place the counting contract underneath as the rule that governs every comparison.
