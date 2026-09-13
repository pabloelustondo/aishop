# Benchmark 13 — Dense Shelf, Agent First-Run Review

Claude, 2026-09-08. Review proposal; not a human-approved benchmark disposition.
**Result: the run completes and reads the shelf; parity with the 42-group reference not demonstrated.**

## Evidence and scope

- Pablo supplied the result page text and a [screenshot](images/dense-shelf-03-agent-first-run-2026-09-08.png): `vista-benachmark-1-original.jpeg`, Analysed, 1 run, 654 kB, `gpt-5.4-mini`, 2026-09-08 13:22, 1152 × 1536.
- Compared against the [register](02-register-upper-middle.md), [its continuation](03-register-lower-bottom.md) and the numbered overlay. The reference is a hand-obtained GPT output, not verified ground truth ([limits](04-limits.md)).
- The same image failed on its first attempt before the Sprint 010 deployment (`provider_failed`, 502 after 7.09 s, recorded in `sprint-010/03-output-limit-acceptance.md`). This run followed that deployment. Whether the output cap explains the difference is for the log check, not this review.
- A second, independent read of the photograph is in [06](06-independent-visual-read.md); it is used here only where the reference and the agent disagree.

## Comparison by region

| Reference (IDs · units) | Agent rows (facings · confidence) | Assessment |
| --- | --- | --- |
| Herklin, 5 variants (2–6 · 18) | "white/blue boxes" 10 medium; "green/teal" 4 medium | 14 vs 18 units, near the facing count; variants collapsed into two colour groups |
| "…xia" cartons (1 · 2) | absent | Missed, edge-clipped; reference itself low |
| Anlett cream (7 · 4) | absent | **Missed with a readable front**; the clearest omission |
| Medipiox, Scabisan, Coctelab lotion and shampoo (8–11 · 1 each) | 1, 1, 1, 1 high | Match |
| Herbacil Champiojo (12 · 1) | "Herkaci shampoo box" 1 high | Count matches; **brand misread at high confidence** |
| Herbacil gel (13 · 5, two fronts) | "small white-capped glass bottles" 4 low, plus one uncertain entry | Identity not recovered; 4 sits between 2 facings and 5 units |
| X-Termin two designs (14–15 · 4), Medicasp (16 · 3) | 4 high, 3 high | Match; designs merged, acceptable for facings |
| BTX (17 · 2) | 2 medium | Match |
| Tepezcohuite white and dark jars (18–19 · 13) | "Tepezcohuite/Tepez jars" 5 medium | Brand read; 5 is neither 4 facings nor 13 units |
| Derman tubs and emulsions, 3 lines each (20–25 · 12) | "Blue 'Berman' hair-care bottles/jars" 9 medium, plus one uncertain entry | **Brand misread, category wrong** (skin care); 9 equals the tubs alone |
| Midai shampoo (26 · 2) | "Midal" 2 high | Match; spelling differs across all three sources |
| Edge fragments (27–29 · 3) | absent | Reference low; abstention acceptable |
| Gel Térmico, Coctelab hair-loss box (30–31 · 1 each) | absent | Missed, both readable |
| Tress / Adress shampoo, 3 variants (32–34 · 3) | "Ercress hair-care boxes" 4 high | Brand garbled, one overcount, variants collapsed |
| Tío Nacho, Sistema GB 1 and 2 (35–37 · 3) | 1, 2 high | Match |
| Botika Grisi Anti-Caída, Engrosador (38–39 · 6) | four rows, 5 high | One short; split by claim, not by the two lines |
| Cre-C, two variants (40–41 · 2) | 1 high | Second variant missed, clipped |
| Carton tubs (42 · 5, excluded as stock) | "Large cardboard box of assorted items" 1 high, plus one uncertain entry | **Cardboard counted as a product**; contents abstained |

## Totals and what they do not say

The agent returned 23 rows summing to **62 facings** and 3 uncertain entries against a reference of **42 groups, 94 units**. 62/94 is not an accuracy figure: the reference counts inclusive units, the contract counts facings, and neither is human-verified.
The 40-row schema cap was not reached, so the missing groups come from coarser grouping and outright omission, not from truncation.
Three brand names are wrong at medium or high confidence (Herkaci, Berman, Ercress). A wrong name with high confidence is a worse outcome for a retail user than an abstention.

## Next

Keep this run as the uc-02 baseline; a refined run is separate evidence. Pull this request's structured log (output tokens, `status`, durations) to close the 03-output-limit question. Decide the three benchmark-04 contract gaps before scoring: they explain most of the numeric gaps above.
