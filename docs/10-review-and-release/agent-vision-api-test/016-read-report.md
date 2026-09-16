# Test 016 — Retrieve the completed report

Result: PASS for report retrieval; manual accuracy acceptance pending.

## Purpose and command

Read the report of the existing completed analysis, without starting another run.
Use the same authenticated Bash session:

```bash
source scripts/agent-api-tests/016-read-report.sh
```

Expected HTTP 200, status analyzed, non-null report and error null.
The script prints report content, which may contain private business information.
Review before sharing; no bearer token or upload-session URL is printed.

## Review boundaries

Successful retrieval proves availability, not accuracy.
Compare products and counts with the actual uploaded video.
Consider repeated views of the same shelf, uncertainty and whether the video
depicts a shelf at all. Do not assume the input content from its filename.
Record retrieval outcome separately from manual content acceptance.

## Observed result

Pablo supplied HTTP 200, status analyzed, error null, and a populated report
for analysis `0621956927cd49e4b59b43704b2a0b67`.
The report contains a summary, nine identified product groups and three uncertain items.

| Reported group (abbreviated) | Count | Model confidence |
|---|---|---|
| Black L'Oréal Revitalift item | 1 | low |
| Purple/blue L'Oréal hyaluron gel | 1 | low |
| Yellow SPF 50 box | 1 | low |
| Cicatricure Gold Lift dropper boxes | 2 | high |
| Cicatricure Gold Lift Anti Arrugas | 4 | high |
| Orange Vitacilina Vitamin C | 6 | high |
| Red Vitacilina Retinol | 4 | high |
| Dark Vitacilina Colágeno | 4 | high |
| POND'S jars/tubs | 4 | high |

The reported counts total 27; this is not a human-verified inventory.
The model describes repeated views of one arrangement, but this alone does not
prove cross-frame deduplication is correct. It flags cropped/obscured small boxes
and explicitly admits the counted black L'Oréal item could instead be signage.
Review that item and the remaining counts against the actual video or sampled frames.
The source video and frames were not independently inspected during this result review.
