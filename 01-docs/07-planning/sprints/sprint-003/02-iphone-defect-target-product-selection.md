# Sprint 003 Defect — Target Product Selects a Distractor

HumanReviewerInitials:PME

## Summary

Target Product mode can analyze a prominent surrounding product instead of the product deliberately selected by the center crosshair.

## Evidence

The provided iPhone screenshot shows the crosshair centered on a white-and-blue salt container. A large Cheerios box is visible to its left but is outside the crosshair.

After capture, AI Shop reported the target as Cheerios. The salt had been recognized in an earlier attempt, so this is a target-selection failure rather than evidence that salt is always unrecognizable.

## Reproduction

1. Open **Target Product** mode.
2. Place the center crosshair over the salt container.
3. Keep a visually prominent different product, such as Cheerios, elsewhere in the frame.
4. Capture and wait for the Target Product report.
5. Observe that the report identifies the surrounding product.

## Expected behavior

The product beneath the crosshair is always primary. Surrounding objects may provide context but must never replace it. If the target cannot be identified, report uncertainty about that target instead of selecting another product.

## Impact

The defect breaks the defining promise of Target Product mode and makes a detailed report unreliable even when the interface shows the intended selection correctly.

## Cause hypothesis

The visual crosshair may exist only as a UI overlay, while the model receives the full image without a sufficiently precise target location. A salient product can then dominate selection. This must be confirmed from the capture request and server prompt before choosing a fix.

## Acceptance criteria

- The same scene identifies the salt as primary or reports uncertainty about the salt.
- The report never substitutes the off-center Cheerios box as the target.
- A regression test covers a centered target with a more prominent distractor.
- Target selection remains correct on Pablo's physical iPhone.
- Area Scan behavior and the full-frame contextual evidence remain intact.
