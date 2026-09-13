# Benchmark 14 — Dense Shelf, Independent Visual Read

Claude, 2026-09-08, from the same 1152 × 1536 original, examined shelf by shelf at crop level. A third opinion for the disputed rows in [05](05-agent-first-run-benchmark-review.md); like the reference, a model output and not ground truth.

## Method

Front facings on the active display plane, as the `areaScan` contract asks. Stacked jars are given both numbers: columns as facings, jars as units. Edge-clipped objects marked partial. Price labels, rails, signage and the aisle carton excluded.

## Read

| Shelf | Product | Facings | Note |
| --- | --- | --- | --- |
| 1 | Herklin Prevención, yellow | 4 | two small, two large |
| 1 | Herklin Clásico, turquoise | 2 | |
| 1 | Herklin Clásico, blue | 3 | reference folds these into ID 4 or 5 |
| 1 | Herklin Esencial, dark blue | 4 | |
| 1 | Herklin kit / Tratamiento, purple | 2 | one clipped |
| 1 | Yellow "…xia" carton | 1 partial | |
| 2 | Anlett crema, Medipiox, Scabisan, Cocteel Lab loción, Cocteel Lab shampoo | 1 each | Anlett partial; box reads "Cocteel Lab" |
| 2 | Herbacil shampoo box | 1 | vertical "Champiojo" wordmark |
| 2 | Herbacil gel, clear bottle, white cap, infant on label | 2 | the agent's low-confidence cluster |
| 2 | X-Termin Piojos | 4 | |
| 2 | Medicasp | 3 | one more clipped at the right |
| 3 | BTX cream | 1 | one behind |
| 3 | Tepezcohuite white/blue jars | 2 columns · 6 units | |
| 3 | Tepezcohuite amber jars | 2 columns · 6 units | |
| 3 | Derman PS Calm, DB Calm, Atopi Calm tubs | 3 columns · 9 units | "cuidados intensivos", skin care |
| 3 | Derman DB Calm, PS Calm, Atopi Calm pump bottles | 3 | |
| 3 | Midai shampoo, Minoxidil / Keratina | 2 | |
| 4 | Gel Térmico box, Cocteel Lab hair-loss treatment | 1 each | first partial |
| 4 | Adress Fuerza y Grosor, Control Caspa, Xpert Anticaída | 3 | reference reads the wordmark as "Tress" |
| 4 | Tío Nacho aclarante, Sistema GB Shampoo 1, Shampoo 2 | 1 each | |
| 4 | Botika Grisi Anti-Caída ×2, Engrosador ×2 | 4 | reference says 6 |
| 4 | Cre-C Hidratación | 1 | second bottle clipped |

Facings total **≈ 57** with 21 units in stacks behind them; Herklin could be 14–16 where boxes overlap.

## Where the three readings disagree, and why

- **Herklin, Botika, Tepezcohuite:** reference 18 / 6 / 13, agent 14 / 5 / 5, this read 15 / 4 / 4 facings. The spread is the facings-versus-units gap in benchmark-04, not three different perceptions of the shelf.
- **Derman:** reference 12, agent 9, this read 6 facings and 12 units. The agent's 9 is the tubs; the pump bottles were folded away, and the brand was misread.
- **Anlett, Gel Térmico, Cocteel Lab hair-loss:** present for both the reference and this read, absent for the agent. These are recall misses, not contract questions.
- **Adress / Tress / Ercress:** one wordmark, three spellings. Only a catalog or barcode settles it; the register should record the uncertainty rather than pick one.
- **Carton:** excluded by the reference and this read, counted by the agent. The non-product classification gap in benchmark-04.

## Caveat

Same photograph, same pixel budget, different reader. Nothing above is verified; it narrows the disputes for the human validation that [04](04-limits.md) still owes.
