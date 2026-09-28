# What we still need to confirm

The current screenshots explain the audit UI, but not the complete detection workflow.
Do not resolve the following questions by guessing from product tables.

## Ask the application owner

- What do ANTES and DESPUÉS mean: shelf intervention, capture timing or result correction?
- Where are raw YOLO detections displayed/exported, and where are inspector edits stored?
- What does “N productos” count: catalog rows, detections, assortment or something else?
- What exactly do Sellout Semanal and Inventario Día Anterior measure and where originate?
- Does catalog scope vary by client, category, store, date or model version?
- Does Estado OK mean active, trained, image available or another status?
- How do catalog EANs map to YOLO class IDs? Can multiple packages share a class?
- Are detected counts facings, total visible units or something else?
- Which capture/model/app versions produced these examples?

## Next evidence package

Provide one complete, small visit example before collecting a large dataset:

1. Original before and after photographs, separately labeled and not browser screenshots.
2. Visit/evidence IDs, timestamps, category and capture-stage definitions.
3. Raw YOLO output with class IDs, counts and available boxes/confidences.
4. Inspector changes, their timing and final reviewed result.
5. The exact applicable catalog and class-to-catalog mapping.
6. A human count/identity review on the same original images.

Higher-resolution screenshots help document the UI but cannot replace original photos
or machine-readable predictions for a fair recognition benchmark.
Keep later improved assets as new versions; do not silently overwrite this initial evidence.
No exact shelf counts are asserted from these compressed screenshots.
