# Catalog inspection

Source: [unchanged workbook](assets/catalog-original.xlsx), supplied as
VISTA-YOLO-APP-CATALOG.xlsx. Inspected read-only; worksheet `Catálogo`, A1:G71.
Row 1 is the header; rows 2–71 contain **70 product entries**.

| Column | Meaning visible in the source | Integration consideration |
|---|---|---|
| Foto | Picture column; cell values are empty | Workbook contains 70 embedded media files; do not discard drawings |
| EAN | Product identifier | Preserve as text; no duplicate values observed |
| Nombre | Product description including size | Preserve original plus separately reviewed normalization |
| Brand | Brand | Four distinct values |
| Line | Product line | Do not assume identical to UI categories or YOLO classes |
| Subline | Subclassification | Eight missing values; do not invent replacements |
| Estado | All 70 values are OK | Meaning of OK and active-catalog applicability need confirmation |

| Brand | Entries |
|---|---:|
| VITACILINA | 34 |
| LACTACYD | 19 |
| DERMAN | 15 |
| ROCAINOL | 2 |
| Total | 70 |

## Data quality and identity

EAN has 62 values of length 13 and eight of length 12. Mixed lengths are not by
themselves proof of invalid barcodes; validate the identifier convention/check digits
before normalization. Do not silently pad, truncate or convert identifiers to numbers.
No missing EAN, Nombre, Brand, Line or Estado values were observed.
Embedded media existence is confirmed; image-to-row mapping and packaging currency
have not been validated. Empty Foto cells do not mean product images are absent.
Some descriptions contain encoding artifacts, e.g. C6 `EMULSI√ìN`, C7 `F√âMINA`,
C18 `COL√ÅGENO`. C20 spells the brand `VITACILNA` while D20 is `VITACILINA`.
Retain the supplied strings; propose corrections separately for review.

## Connection to the screenshots and previous AI Shop report

The nine Capilares names appear in the workbook; its capillary line also includes
additional products. A displayed category can therefore be a subset of this file.
The four displayed foot-care items appear at rows 54, 2, 29 and 28 respectively.
Vitacilina facial Retinol, Colágeno and Vitamin C are at rows 17–19, with identifiers
7502250342556, 7502250342563 and 7502250342570. They are candidate matches for
the earlier AI Shop report, not visually confirmed SKU matches.
L'Oréal, POND'S and Cicatricure are absent from this workbook's Brand values.
Their earlier reported counts must not inflate a catalog-scoped comparison score.
