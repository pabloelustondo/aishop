# Repository Audit — Architecture Delta

Read-only audit at commit `fa1e64c`, branch `dev`, 2026-09-06.

## What the server is today

One Firebase function, `api`, region `northamerica-northeast2`,
1 GiB, `maxInstances: 1`, `concurrency: 1`, `timeoutSeconds: 120`.
It fronts four handlers through `firebase-api-router.js`: VISTA package
ingest, VISTA package read, `/inspections`, and the legacy path.

Recognition already exists, synchronously:
`POST /v1/vista/inspection-packages/{runId}/artifacts/{sha256}/analysis`
in `vista-package-read.js` analyses one stored photograph through
`openai-analyzer.js` and writes `analysis.photos.{sha256}` on the run
record. It is hardcoded to `mode: "areaScan"`.

Evidence lives at
`vista/inspection-packages/{ownerKey}/{runId}/artifacts/{sha256}` in
Storage; run records at
`vistaInspectionPackageOwners/{ownerKey}/runs/{runId}` in Firestore.
Both are create-only. Ownership is the SHA-256 of the verified uid.

## What yesterday's commit added

`analysis-contracts.js` gained a third mode, `areaScanCatalog`: a closed
world whose `productId` is an enum of catalog identifiers, with a
`readAs` field and a per-row facing `count`. `areaScan` gained `count`
too, and both ceilings moved from 12 to 40 products.

No route calls `areaScanCatalog`. It is reachable only through
`/inspections` and the tests. The catalog-constrained counting the
handoff asks for is therefore half-built and unwired.

## Delta against the proposed architecture

Absent entirely: any queue, any Python, any worker, any asynchronous
run lifecycle, and the observation → instance → aggregate data model
that the whole counting contract rests on. Today's answer is one model
response about one photograph, stored as-is; there is no notion of a
physical instance surviving across frames, and nothing to reconcile.

The proposal is therefore additive in deployment and foundational in
data model. The second is the larger change and the one Increment 0 is
supposed to settle.
