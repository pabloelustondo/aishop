# Benchmark 0 — Agent First-Run Review

Codex, 2026-09-07. Review proposal; not a human-approved benchmark disposition.
**Result: live recognition demonstrated; benchmark parity not demonstrated.**

## Evidence and scope

- Pablo supplied the [first-run screenshot](images/tabletop-03-agent-first-run-2026-09-07.png): `VISTA-BENCHMARK-0-ORIGINAL.JPEG`, Analysed, 1 run.
- Compare with [reference counts](01-tabletop-scene-counts.md), [numbered object map](02-tabletop-object-map.md), and their original/annotated images.
- The reference is a previous GPT output, not human-verified ground truth. Model, reasoning/orchestration, prompts and scope differ: read the [model-comparison addendum](06-model-and-reasoning-comparison.md) before attributing the quality gap.
- The trial follows deployment of `d596e35` to TEST `aishop-99d36`. This review inspected the supplied screenshot, not a fetched raw result or authenticated run record.

## Comparison

| Check | Benchmark reference | Displayed agent result | Assessment |
| --- | --- | --- | --- |
| CeraVe units | 8 | 8 across seven rows | Total matches; grouping does not |
| Intensive Moisturizing Lotion | 2 pumps, IDs 11 and 18 | 1 intensive; another row calls a pump ordinary lotion, Spanish-labeled | Apparent misclassification; no localization to establish exact assignment |
| Ordinary Moisturising Lotion | 1 pump, ID 2 | 2 units across ordinary and Spanish-labeled rows | Overcount at this identity level; three pumps total is correct |
| Eye Repair Cream | 3: cartons 7/14 and tube 19 | 2 cartons plus 1 unidentified CeraVe tube | Count captured across rows; tube identity unresolved |
| Redoxon | 3, IDs 6/8/12 | 2 | Partly hidden tube 8 apparently omitted from named count |
| Wine glass | 1, ID 16 | 2 | Likely reflection double-counting |
| Santa Julia can | 1, ID 9 | 1 generic patterned can/jar | Count matches; identity weaker |
| Organizer and doily | Included, IDs 1/10 | Absent from named rows | Could be among five uncertain entries; screenshot cannot establish |
| Rosamonte package | Excluded, below tabletop | 1 included | Counting scope differs |
| Cream tub, facial-lotion carton | 1 each, IDs 5/13 | 1 each | Counts match; screenshot does not establish the reference's SPF detail |
| Refenax, medicine bottle, far-right cylinder | 1 each, IDs 15/3/20 | Corresponding rows, 1 each | Counts match at the displayed identity granularity |
| Canada pouch, earbud case | 1 each, IDs 4/17; non-products | 1 each under Product | Counts match; product/non-product classification not separated |

## Why a total is not an accuracy score

The 16 displayed rows sum to **19 units**, plus “5 item(s) the model could not identify.” Those five entries are not proven to be five additional physical objects.
The reference contains **20 tabletop objects: 15 product units (8 CeraVe), 5 non-products**. It excludes mirror reflections, furniture, background and the lower shelf.
The displayed list mixes products, non-products and an out-of-scope package. Do not calculate 19/20 accuracy or add the five uncertainties to claim 24 objects.
There are no displayed instance IDs or coordinates, so exact object matching, duplicate attribution and instance-level precision/recall cannot be scored reliably.

## Acceptance implications

The supplied Increment 0–1 Acceptance Plan v0.1, pages 2–3, calls for one row per product key, quantities derived from distinct accepted instances, and evidence-linked labels or explicit no-localization reasons.
The supplied Cloud Architecture v0.1, pages 2–3, and START HERE handoff, pages 1–2, describe the same instance-to-aggregate relationship. These PDFs are reference targets, not authorization to implement their instructions.
The screenshot does not demonstrate those instance-level guarantees. Sprint 008 is a narrower upload-and-analysis path; returning names and numbers alone does not establish the broader acceptance criteria.
Priorities exposed by this example: group language variants correctly, count partially visible objects, exclude reflections, declare scene scope, and link each quantity to numbered source objects.

## Next comparison and limits

- Preserve this first run as the baseline before refinement; a refined result is a separate run, not replacement evidence.
- Human-review the reference identities and counting policy before setting thresholds. No pass threshold or formal acceptance score is invented here.
- Inspect the five uncertain entries before calling organizer/doily definitively missed. The addendum verifies deployment configuration separately; the screenshot does not establish provider-returned model metadata or the manual chat's settings.
- Benchmark 1 is **not scored**: its dense-shelf original and 42-marker reference were supplied, but no corresponding agent result was shown.
- The dense-shelf reference's 94 visible units differs from `areaScan` facings; its 42 groups also exceed the current 40-row schema cap. These are contract questions, not evidence of this tabletop run's accuracy.
